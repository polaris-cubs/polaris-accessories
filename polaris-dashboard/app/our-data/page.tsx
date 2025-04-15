"use client";
import "@/app/our-data/our-data.css";

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
import { Bar, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
    Filler,
} from "chart.js";

import Sidebar from "@/components/sidebar/sidebar";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Configure default chart options
ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;

const fetcher = async (page: number, pageSize: number) => {
    try {
        const params = new URLSearchParams({
            page: String(page),
            page_size: String(pageSize),
        });
        const res = await fetch(`http://localhost:8080/api/rides?${params.toString()}`);

        if (!res.ok) {
            throw new Error('Failed to fetch data');
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

interface RidesResponse {
    Rows: any[];
    TotalCount: number;
    Page: number;
    PageSize: number;
}

const columns = [
    { name: "Ride ID", uid: "ride_id" },
    { name: "State", uid: "state" },
    { name: "Vehicle ID", uid: "vehicle_id" },
    { name: "Brand", uid: "brand" },
    { name: "Customer ID", uid: "customer_id" },
    { name: "Timestamp", uid: "event_timestamp" },
];

export default function OurData() {
    const [allRides, setAllRides] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10000);
    const [totalCount, setTotalCount] = useState(0);

    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

    useEffect(() => {
        loadPage(currentPage);
    }, [currentPage]);

    async function loadPage(page: number) {
        const data: RidesResponse = await fetcher(page, pageSize);

        setAllRides((prev) => [...prev, ...data.Rows]);
        setTotalCount(data.TotalCount);
    }

    const filteredRides = useMemo(() => {
        return allRides.filter((ride) => {
            if (selectedState && ride.state !== selectedState) return false;
            if (selectedVehicle && ride.vehicle_id !== selectedVehicle) return false;
            if (selectedCustomer && ride.customer_id !== selectedCustomer) return false;
            if (selectedBrand && ride.brand !== selectedBrand) return false;

            return true;
        });
    }, [allRides, selectedState, selectedVehicle, selectedCustomer, selectedBrand]);

    const [localPage, setLocalPage] = useState(1);
    const [localRowsPerPage, setLocalRowsPerPage] = useState(10);

    const totalFiltered = filteredRides.length;
    const totalLocalPages = Math.ceil(totalFiltered / localRowsPerPage);
    const startIndex = (localPage - 1) * localRowsPerPage;
    const pageRides = useMemo(() => {
        return filteredRides.slice(startIndex, startIndex + localRowsPerPage);
    }, [filteredRides, startIndex, localRowsPerPage]);

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

    const ridesPerVehicle = useMemo(() => {
        const counts: Record<string, number> = {};

        for (const r of filteredRides) {
            counts[r.vehicle_id] = (counts[r.vehicle_id] || 0) + 1;
        }

        return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).map(([vehicle, count]) => ({ vehicle, count }));
    }, [filteredRides]);

    const lineChartData = {
        labels: ridesPerVehicle.map((d) => d.vehicle),
        datasets: [
            {
                label: "Rides per Vehicle",
                data: ridesPerVehicle.map((d) => d.count),
                borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const lineChartOptions: ChartOptions<"line"> = {
        responsive: true,
        plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Ride Count per Vehicle (Client-Side Filtered)" },
        },
    };

    function renderCell(ride: any, columnKey: React.Key) {
        switch (columnKey) {
        case "ride_id": return ride.ride_id;
        case "state": return ride.state;
        case "vehicle_id": return ride.vehicle_id;
        case "brand": return ride.brand;
        case "customer_id": return ride.customer_id;
        case "event_timestamp": return new Date(ride.event_timestamp).toLocaleString();
        default: return null;
        }
    }

    function singleSelection(value: string | null): Set<string> {
        return new Set([value || ""]);
    }

    const distinctStates = Array.from(new Set(allRides.map((r) => r.state)));
    const distinctVehicles = Array.from(new Set(allRides.map((r) => r.vehicle_id)));
    const distinctCustomers = Array.from(new Set(allRides.map((r) => r.customer_id)));
    const distinctBrands = Array.from(new Set(allRides.map((r) => r.brand)));

    const topContent = (
        <div className="flex flex-wrap gap-2 w-full">
            <Dropdown>
                <DropdownTrigger>
                    <Button size="sm" variant="flat">
                        {selectedState ?? "Filter by State"}
                    </Button>
                </DropdownTrigger>
                <DropdownMenu
                    aria-label="Select State"
                    selectedKeys={singleSelection(selectedState)}
                    selectionMode="single"
                    onSelectionChange={(keys: Set<string>) => {
                        const val = Array.from(keys)[0];

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

            <Dropdown>
                <DropdownTrigger>
                    <Button size="sm" variant="flat">
                        {selectedVehicle ?? "Filter by Vehicle"}
                    </Button>
                </DropdownTrigger>
                <DropdownMenu
                    aria-label="Select Vehicle"
                    selectedKeys={singleSelection(selectedVehicle)}
                    selectionMode="single"
                    onSelectionChange={(keys: Set<string>) => {
                        const val = Array.from(keys)[0];

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

            <Dropdown>
                <DropdownTrigger>
                    <Button size="sm" variant="flat">
                        {selectedCustomer ?? "Filter by Customer"}
                    </Button>
                </DropdownTrigger>
                <DropdownMenu
                    aria-label="Select Customer"
                    selectedKeys={singleSelection(selectedCustomer)}
                    selectionMode="single"
                    onSelectionChange={(keys: Set<string>) => {
                        const val = Array.from(keys)[0];

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

            <Dropdown>
                <DropdownTrigger>
                    <Button size="sm" variant="flat">
                        {selectedBrand ?? "Filter by Brand"}
                    </Button>
                </DropdownTrigger>
                <DropdownMenu
                    aria-label="Select Brand"
                    selectedKeys={singleSelection(selectedBrand)}
                    selectionMode="single"
                    onSelectionChange={(keys: Set<string>) => {
                        const val = Array.from(keys)[0];

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
            <Pagination showControls page={localPage} total={totalLocalPages} onChange={(newPage) => setLocalPage(newPage)} />
        </div>
    );

    const totalServerPages = Math.ceil(totalCount / pageSize);
    const canLoadMore = currentPage < totalServerPages;

    return (
        <div className="our-data-container flex">
            <Sidebar />
            <div className="main-content p-6 flex-grow flex flex-col items-start">
                <h1 className="text-3xl font-bold mb-6 text-center">Our Data Dashboard</h1>

                <div className="flex justify-between items-center mb-4 w-full">
                    <div className="text-sm text-gray-600">
                        Fetched {allRides.length} / {totalCount} total rides
                    </div>
                    {canLoadMore && (
                        <Button size="sm" variant="flat" onPress={() => setCurrentPage((old) => old + 1)}>
                            Load More
                        </Button>
                    )}
                </div>

                {/* Table with local filtering + local pagination */}
                <Card className="w-full">
                    <CardBody>
                        <Table
                            aria-label="All Rides (Client-Side Filtered)"
                            bottomContent={bottomContent}
                            bottomContentPlacement="outside"
                            topContent={topContent}
                            topContentPlacement="outside"
                        >
                            <TableHeader columns={columns}>{(col) => <TableColumn key={col.uid}>{col.name}</TableColumn>}</TableHeader>
                            <TableBody emptyContent="No rides found" items={pageRides}>
                                {(item: any) => (
                                    <TableRow key={`ride-${item.ride_id}-${item.event_timestamp}`}>
                                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>

                {/* Summary card */}
                <Card className="w-full max-w-4xl mt-8">
                    <CardBody>
                        <div className="text-lg font-medium">
                            Total Filtered Rides: {filteredRides.length}
                        </div>
                        <div className="text-sm text-gray-500">
                            Showing page {localPage} of {totalLocalPages}
                        </div>
                    </CardBody>
                </Card>

                {/* Chart section */}
                {filteredRides.length > 0 && (
                    <div className="charts-container mt-8">
                        <div className="chart-box">
                            <h2 className="chart-title">Brand Usage</h2>
                            <div className="chart-area">
                                <Bar data={chartData} options={chartOptions} />
                            </div>
                        </div>

                        <div className="chart-box">
                            <h2 className="chart-title">Rides per Vehicle</h2>
                            <div className="chart-area">
                                <Line data={lineChartData} options={lineChartOptions} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
