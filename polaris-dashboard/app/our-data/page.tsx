"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Card,
    CardBody,
    Pagination,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Button,
} from "@heroui/react";

import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const fetcher = async (page: number, pageSize: number) => {
    const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
    });
    const res = await fetch(`http://localhost:8080/api/rides?${params.toString()}`);
    return res.json();
};

// We'll define a shape for the server response
interface RidesResponse {
    Rows: any[];
    TotalCount: number;
    Page: number;
    PageSize: number;
}

// Table columns
const columns = [
    { name: "Ride ID", uid: "ride_id" },
    { name: "State", uid: "state" },
    { name: "Vehicle ID", uid: "vehicle_id" },
    { name: "Brand", uid: "brand" },
    { name: "Customer ID", uid: "customer_id" },
    { name: "Timestamp", uid: "event_timestamp" },
];

export default function OurData() {
    // --------------- Local States ---------------
    // We'll keep all loaded rides in `allRides`.
    const [allRides, setAllRides] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(50); // or user picks
    const [totalCount, setTotalCount] = useState(0);

    // Client-side filter states
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

    // --------------- Phase 1: Load data in pages ---------------
    // We'll do a "Load More" approach.
    // As soon as the user hits the page, we fetch the first page.
    useEffect(() => {
        loadPage(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    async function loadPage(page: number) {
        const data: RidesResponse = await fetcher(page, pageSize);
        // Append new Rows to allRides
        setAllRides((prev) => [...prev, ...data.Rows]);
        setTotalCount(data.TotalCount);
    }

    // If you'd prefer infinite scroll, you'd detect user scroll position
    // and call `setCurrentPage(old => old + 1)` automatically.

    // --------------- Phase 2: Client-Side Filtering ---------------
    // We apply filters to `allRides`
    const filteredRides = useMemo(() => {
        return allRides.filter((ride) => {
            // State filter
            if (selectedState && ride.state !== selectedState) return false;
            // Vehicle filter
            if (selectedVehicle && ride.vehicle_id !== selectedVehicle) return false;
            // Customer filter
            if (selectedCustomer && ride.customer_id !== selectedCustomer) return false;
            // Brand filter
            if (selectedBrand && ride.brand !== selectedBrand) return false;
            return true;
        });
    }, [allRides, selectedState, selectedVehicle, selectedCustomer, selectedBrand]);

    // --------------- Local Pagination for the filtered results ---------------
    // We might do a simple table pagination inside HeroUI.
    // Or we can do infinite scroll. Let's do a local "page" for the table too.
    const [localPage, setLocalPage] = useState(1);
    const [localRowsPerPage, setLocalRowsPerPage] = useState(10);

    const totalFiltered = filteredRides.length;
    const totalLocalPages = Math.ceil(totalFiltered / localRowsPerPage);
    const startIndex = (localPage - 1) * localRowsPerPage;
    const pageRides = useMemo(() => {
        return filteredRides.slice(startIndex, startIndex + localRowsPerPage);
    }, [filteredRides, startIndex, localRowsPerPage]);

    // --------------- Chart (client-side) ---------------
    // Suppose we want a brand usage chart from the filtered rides
    // We'll group them by brand:
    const brandCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const r of filteredRides) {
            counts[r.brand] = (counts[r.brand] || 0) + 1;
        }
        return Object.entries(counts).map(([brand, cnt]) => ({ brand, rides: cnt }));
    }, [filteredRides]);

    const chartOptions: ChartOptions<"bar"> = {
        responsive: true,
        plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Vehicle Usage (Client-Side Filtered)" },
        },
    };
    const chartData = {
        labels: brandCounts.map((b) => b.brand),
        datasets: [
            {
                label: "Total Rides",
                data: brandCounts.map((b) => b.rides),
            },
        ],
    };

    // --------------- Render Cell Helper ---------------
    function renderCell(ride: any, columnKey: React.Key) {
        switch (columnKey) {
            case "ride_id":
                return ride.ride_id;
            case "state":
                return ride.state;
            case "vehicle_id":
                return ride.vehicle_id;
            case "brand":
                return ride.brand;
            case "customer_id":
                return ride.customer_id;
            case "event_timestamp":
                return new Date(ride.event_timestamp).toLocaleString();
            default:
                return null;
        }
    }

    // --------------- Single Selection Helper for HeroUI <Dropdown> ---------------
    function singleSelection(value: string | null) {
        return value ? new Set([value]) : new Set([""]);
    }

    // We can glean the distinct states, vehicles, etc. from `allRides` if we want client-only:
    const distinctStates = Array.from(new Set(allRides.map((r) => r.state)));
    const distinctVehicles = Array.from(new Set(allRides.map((r) => r.vehicle_id)));
    const distinctCustomers = Array.from(new Set(allRides.map((r) => r.customer_id)));
    const distinctBrands = Array.from(new Set(allRides.map((r) => r.brand)));

    // --------------- HeroUI top content: filters ---------------
    const topContent = (
        <div className="flex flex-wrap gap-2 w-full">
            {/* State Filter */}
            <Dropdown>
                <DropdownTrigger>
                    <Button variant="flat" size="sm">
                        {selectedState ?? "Filter by State"}
                    </Button>
                </DropdownTrigger>
                <DropdownMenu
                    aria-label="Select State"
                    selectionMode="single"
                    selectedKeys={singleSelection(selectedState)}
                    onSelectionChange={(keys) => {
                        const val = keys.values().next().value;
                        setSelectedState(val === "" ? null : val);
                        setLocalPage(1);
                    }}
                >
                    <DropdownItem key="">All States</DropdownItem>
                    {distinctStates.map((s) => (
                        <DropdownItem key={s}>{s}</DropdownItem>
                    ))}
                </DropdownMenu>
            </Dropdown>

            {/* Vehicle Filter */}
            <Dropdown>
                <DropdownTrigger>
                    <Button variant="flat" size="sm">
                        {selectedVehicle ?? "Filter by Vehicle"}
                    </Button>
                </DropdownTrigger>
                <DropdownMenu
                    aria-label="Select Vehicle"
                    selectionMode="single"
                    selectedKeys={singleSelection(selectedVehicle)}
                    onSelectionChange={(keys) => {
                        const val = keys.values().next().value;
                        setSelectedVehicle(val === "" ? null : val);
                        setLocalPage(1);
                    }}
                >
                    <DropdownItem key="">All Vehicles</DropdownItem>
                    {distinctVehicles.map((v) => (
                        <DropdownItem key={v}>{v}</DropdownItem>
                    ))}
                </DropdownMenu>
            </Dropdown>

            {/* Customer Filter */}
            <Dropdown>
                <DropdownTrigger>
                    <Button variant="flat" size="sm">
                        {selectedCustomer ?? "Filter by Customer"}
                    </Button>
                </DropdownTrigger>
                <DropdownMenu
                    aria-label="Select Customer"
                    selectionMode="single"
                    selectedKeys={singleSelection(selectedCustomer)}
                    onSelectionChange={(keys) => {
                        const val = keys.values().next().value;
                        setSelectedCustomer(val === "" ? null : val);
                        setLocalPage(1);
                    }}
                >
                    <DropdownItem key="">All Customers</DropdownItem>
                    {distinctCustomers.map((c) => (
                        <DropdownItem key={c}>{c}</DropdownItem>
                    ))}
                </DropdownMenu>
            </Dropdown>

            {/* Brand Filter */}
            <Dropdown>
                <DropdownTrigger>
                    <Button variant="flat" size="sm">
                        {selectedBrand ?? "Filter by Brand"}
                    </Button>
                </DropdownTrigger>
                <DropdownMenu
                    aria-label="Select Brand"
                    selectionMode="single"
                    selectedKeys={singleSelection(selectedBrand)}
                    onSelectionChange={(keys) => {
                        const val = keys.values().next().value;
                        setSelectedBrand(val === "" ? null : val);
                        setLocalPage(1);
                    }}
                >
                    <DropdownItem key="">All Brands</DropdownItem>
                    {distinctBrands.map((b) => (
                        <DropdownItem key={b}>{b}</DropdownItem>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </div>
    );

    // --------------- Local pagination bottom content ---------------
    const bottomContent = (
        <div className="flex justify-between items-center w-full py-2 mt-2">
            <div className="flex items-center gap-2">
                <span className="text-default-400 text-sm">Rows per page:</span>
                <select
                    className="bg-transparent outline-none text-default-500 text-sm"
                    value={localRowsPerPage}
                    onChange={(e) => {
                        setLocalRowsPerPage(Number(e.target.value));
                        setLocalPage(1);
                    }}
                >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                </select>
            </div>
            <Pagination page={localPage} total={totalLocalPages} showControls onChange={(newPage) => setLocalPage(newPage)} />
        </div>
    );

    // --------------- "Load More" button logic ---------------
    // If we haven't loaded all pages from the server yet, let user load more.
    const totalServerPages = Math.ceil(totalCount / pageSize);
    const canLoadMore = currentPage < totalServerPages;

    // --------------- Render ---------------
    return (
        <div className="our-data-container flex">
            {/* Your sidebar */}
            {/* <Sidebar /> */}
            <div className="main-content p-6 flex-grow">
                <h1 className="text-3xl font-bold mb-6 text-center">Our Data Dashboard</h1>

                {/* Remote Pagination UI */}
                <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-600">
                        Fetched {allRides.length} / {totalCount} total rides
                    </div>
                    {canLoadMore && (
                        <Button variant="flat" size="sm" onPress={() => setCurrentPage((old) => old + 1)}>
                            Load More
                        </Button>
                    )}
                </div>

                {/* Table with local filtering + local pagination */}
                <Card>
                    <CardBody>
                        <Table
                            aria-label="All Rides (Client-Side Filtered)"
                            topContent={topContent}
                            topContentPlacement="outside"
                            bottomContent={bottomContent}
                            bottomContentPlacement="outside"
                        >
                            <TableHeader columns={columns}>{(col) => <TableColumn key={col.uid}>{col.name}</TableColumn>}</TableHeader>
                            <TableBody items={pageRides} emptyContent="No rides found">
                                {(item: any) => (
                                    <TableRow key={`ride-${item.ride_id}-${item.event_timestamp}`}>
                                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>

                {/* Example chart (from local filtered data) */}
                {filteredRides.length > 0 && (
                    <Card className="mt-8">
                        <CardBody>
                            <h2 className="text-xl font-semibold mb-4">📊 Local Filtered Brand Usage</h2>
                            <Bar data={chartData} options={chartOptions} />
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    );
}
