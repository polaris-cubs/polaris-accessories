"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
    Input,
    SortDescriptor,
} from "@heroui/react";

import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

import Sidebar from "@/components/sidebar/sidebar";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend, ChartOptions } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, Title, Tooltip, Legend);

interface RidesResponse {
    Rows: RideRow[];
    TotalCount: number;
}
interface RideRow {
    ride_id: number;
    state: string;
    vehicle_id: string;
    brand: string;
    customer_id: number;
    event_timestamp: string;
    property_values: any;
}

const columns = [
    { name: "Ride ID", uid: "ride_id", sortable: true },
    { name: "State", uid: "state", sortable: true },
    { name: "Vehicle ID", uid: "vehicle_id", sortable: true },
    { name: "Brand", uid: "brand", sortable: true },
    { name: "Customer ID", uid: "customer_id", sortable: true },
    { name: "Timestamp", uid: "event_timestamp", sortable: true },
    { name: "Props (JSON)", uid: "property_values" },
];

export function DataContent() {
    // ------------ Fetch & pagination ------------
    const [allRides, setAllRides] = useState<RideRow[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10000;
    const [totalCount, setTotalCount] = useState(0);

    const loadPage = useCallback(
        async (page: number) => {
            const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
            const res = await fetch(`http://localhost:8080/api/rides?${params.toString()}`);
            const data: RidesResponse = await res.json();
            setTotalCount(data.TotalCount);
            setAllRides((prev) =>
                page === 1
                    ? data.Rows
                    : [
                          ...prev,
                          ...data.Rows.filter(
                              (r) =>
                                  !prev.some(
                                      (p) =>
                                          `${p.ride_id}-${p.event_timestamp}-${JSON.stringify(p.property_values)}` ===
                                          `${r.ride_id}-${r.event_timestamp}-${JSON.stringify(r.property_values)}`,
                                  ),
                          ),
                      ],
            );
        },
        [pageSize],
    );

    useEffect(() => {
        loadPage(currentPage);
    }, [currentPage, loadPage]);

    const totalServerPages = Math.ceil(totalCount / pageSize);
    const canLoadMore = currentPage < totalServerPages;

    // ------------ Filters & sorting ------------
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "event_timestamp",
        direction: "ascending",
    });

    const filteredRides = useMemo(() => {
        const lower = searchTerm.trim().toLowerCase();
        return allRides.filter((r) => {
            if (selectedState && r.state !== selectedState) return false;
            if (selectedBrand && r.brand !== selectedBrand) return false;
            if (!lower) return true;
            return (
                String(r.ride_id).includes(lower) ||
                r.state.toLowerCase().includes(lower) ||
                r.vehicle_id.toLowerCase().includes(lower) ||
                r.brand.toLowerCase().includes(lower) ||
                String(r.customer_id).includes(lower) ||
                new Date(r.event_timestamp).toLocaleString().toLowerCase().includes(lower) ||
                JSON.stringify(r.property_values).toLowerCase().includes(lower)
            );
        });
    }, [allRides, selectedState, selectedBrand, searchTerm]);

    const sortedRides = useMemo(() => {
        const arr = [...filteredRides];
        const { column, direction } = sortDescriptor;
        arr.sort((a, b) => {
            let va: any = a[column as keyof RideRow];
            let vb: any = b[column as keyof RideRow];
            if (column === "event_timestamp") {
                va = new Date(a.event_timestamp).getTime();
                vb = new Date(b.event_timestamp).getTime();
            }
            const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
            return direction === "ascending" ? cmp : -cmp;
        });
        return arr;
    }, [filteredRides, sortDescriptor]);

    // ------------ Local pagination ------------
    const [localPage, setLocalPage] = useState(1);
    const [localRowsPerPage, setLocalRowsPerPage] = useState(10);
    const totalLocalPages = Math.ceil(sortedRides.length / localRowsPerPage);
    const pageRides = useMemo(() => {
        const st = (localPage - 1) * localRowsPerPage;
        return sortedRides.slice(st, st + localRowsPerPage);
    }, [sortedRides, localPage, localRowsPerPage]);

    // ------------ Grouping & expansion ------------
    const [groupBy, setGroupBy] = useState<"none" | "brand" | "vehicle_id" | "customer_id" | "ride_id">("none");
    const [groupPage, setGroupPage] = useState(1);
    useEffect(() => setGroupPage(1), [groupBy]);

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [expandedRides, setExpandedRides] = useState<Set<string>>(new Set());

    const toggleRide = (rideKey: string) => {
        setExpandedRides((prev) => {
            const next = new Set(prev);
            next.has(rideKey) ? next.delete(rideKey) : next.add(rideKey);
            return next;
        });
    };

    const aggregatedGroups = useMemo(() => {
        if (groupBy === "none") return null;
        const map: Record<string, RideRow[]> = {};
        sortedRides.forEach((r) => {
            const key = String(r[groupBy]);
            (map[key] = map[key] || []).push(r);
        });
        return Object.entries(map).map(([group, rides]) => {
            const rideMap = new Map<number, RideRow[]>();
            rides.forEach((r) => rideMap.set(r.ride_id, [...(rideMap.get(r.ride_id) || []), r]));
            const rideGroups = Array.from(rideMap, ([rideId, arr]) => ({ rideId, rides: arr }));
            rideGroups.sort((a, b) => a.rideId - b.rideId);
            return { group, rideGroups, count: rideGroups.length };
        });
    }, [groupBy, sortedRides]);

    // ------------ Aggregated sorting & pagination ------------
    const [aggregatedSortDescriptor, setAggregatedSortDescriptor] = useState<SortDescriptor>({
        column: "group",
        direction: "ascending",
    });

    const aggregatedColumns = useMemo(() => {
        if (groupBy === "none") return [];
        return [
            { name: groupBy.charAt(0).toUpperCase() + groupBy.slice(1), uid: "group", sortable: true },
            { name: "Count", uid: "count", sortable: true },
        ];
    }, [groupBy]);

    // ** SORT the aggregated groups **
    const sortedAggregatedGroups = useMemo(() => {
        if (!aggregatedGroups) return [];
        const { column, direction } = aggregatedSortDescriptor;
        return [...aggregatedGroups].sort((a, b) => {
            let va: any = column === "count" ? a.count : a.group;
            let vb: any = column === "count" ? b.count : b.group;
            const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
            return direction === "ascending" ? cmp : -cmp;
        });
    }, [aggregatedGroups, aggregatedSortDescriptor]);

    // ** PAGE the sorted list **
    const [groupRowsPerPage, setGroupRowsPerPage] = useState(10);
    const totalGroupPages = Math.ceil(sortedAggregatedGroups.length / groupRowsPerPage);
    const sortedPageAggregatedGroups = useMemo(
        () => sortedAggregatedGroups.slice((groupPage - 1) * groupRowsPerPage, groupPage * groupRowsPerPage),
        [sortedAggregatedGroups, groupPage, groupRowsPerPage],
    );

    // ------------ Selection & charts ------------
    const [aggSelectedKeys, setAggSelectedKeys] = useState<Set<React.Key>>(new Set());

    // Compute which ride_ids to include in the chart
    const selectedRideIds = useMemo(() => {
        if (aggSelectedKeys.size === 0) return new Set(sortedRides.map((r) => r.ride_id));
        const ids = new Set<number>();
        sortedAggregatedGroups.forEach((grp) => {
            if (aggSelectedKeys.has(grp.group)) {
                grp.rideGroups.forEach((rg) => ids.add(rg.rideId));
            }
        });
        return ids;
    }, [aggSelectedKeys, sortedAggregatedGroups, sortedRides]);

    const brandCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        const idToBrand = new Map<number, string>();
        sortedRides.forEach((r) => idToBrand.set(r.ride_id, r.brand));
        selectedRideIds.forEach((id) => {
            const b = idToBrand.get(id);
            if (b) counts[b] = (counts[b] || 0) + 1;
        });
        return Object.entries(counts).map(([brand, count]) => ({ brand, count }));
    }, [selectedRideIds, sortedRides]);

    const chartData = {
        labels: brandCounts.map((b) => b.brand),
        datasets: [{ label: "Selected Rides by Brand", data: brandCounts.map((b) => b.count) }],
    };
    const chartOptions: ChartOptions<"bar"> = {
        responsive: true,
        plugins: { legend: { position: "top" }, title: { display: true, text: "Brand Usage" } },
    };

    // ------------ Dropdown data ------------
    const distinctStates = Array.from(new Set(allRides.map((r) => r.state)));
    const distinctBrands = Array.from(new Set(allRides.map((r) => r.brand)));
    const singleSel = (v: string | null) => (v ? new Set([v]) : new Set([""]));

    // ------------ Chart toggle dropdown ------------
    const graphOptions = [{ key: "brand", label: "Brand Usage" }];
    const [visibleCharts, setVisibleCharts] = useState<string[]>(graphOptions.map((o) => o.key));

    // ------------ Cell renderer ------------
    const cell = (r: RideRow, key: React.Key) => {
        if (key === "event_timestamp") return new Date(r.event_timestamp).toLocaleString();
        if (key === "property_values") return JSON.stringify(r.property_values);
        return r[key as keyof RideRow];
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-center mb-6">Our Data Dashboard</h1>

            <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">
                    Loaded {allRides.length} / {totalCount}
                </span>
                {canLoadMore && (
                    <Button size="sm" onPress={() => setCurrentPage((p) => p + 1)}>
                        Load More
                    </Button>
                )}
            </div>

            {/* Top controls */}
            <div className="flex flex-wrap items-center mb-4">
                <div className="flex flex-wrap gap-2">
                    <Input
                        placeholder="Search…"
                        variant="bordered"
                        isClearable
                        value={searchTerm}
                        onClear={() => setSearchTerm("")}
                        onValueChange={(val) => {
                            setSearchTerm(val || "");
                            setLocalPage(1);
                        }}
                        className="max-w-[200px]"
                    />
                    <Dropdown>
                        <DropdownTrigger>
                            <Button size="sm" variant="flat">
                                {selectedState ?? "State"}
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            selectionMode="single"
                            selectedKeys={singleSel(selectedState)}
                            onSelectionChange={(k) => {
                                const v = Array.from(k.values())[0];
                                setSelectedState(v === "" ? null : v);
                                setLocalPage(1);
                            }}
                        >
                            <DropdownItem key="">All</DropdownItem>
                            {distinctStates.map((s) => (
                                <DropdownItem key={s}>{s}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button size="sm" variant="flat">
                                {selectedBrand ?? "Brand"}
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            selectionMode="single"
                            selectedKeys={singleSel(selectedBrand)}
                            onSelectionChange={(k) => {
                                const v = Array.from(k.values())[0];
                                setSelectedBrand(v === "" ? null : v);
                                setLocalPage(1);
                            }}
                        >
                            <DropdownItem key="">All</DropdownItem>
                            {distinctBrands.map((b) => (
                                <DropdownItem key={b}>{b}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                </div>

                <div className="flex gap-2 items-center ml-auto">
                    <Dropdown>
                        <DropdownTrigger>
                            <Button size="sm" variant="flat">
                                Charts
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            selectionMode="multiple"
                            selectedKeys={new Set(visibleCharts)}
                            onSelectionChange={(k) => setVisibleCharts(Array.from(k.values()))}
                        >
                            {graphOptions.map((o) => (
                                <DropdownItem key={o.key}>{o.label}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>

                    <Dropdown>
                        <DropdownTrigger>
                            <Button size="sm" variant="flat">
                                Group By: {groupBy !== "none" ? groupBy : "None"}
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            selectionMode="single"
                            selectedKeys={new Set([groupBy])}
                            onSelectionChange={(k) => setGroupBy(Array.from(k.values())[0] || "none")}
                        >
                            <DropdownItem key="none">None</DropdownItem>
                            <DropdownItem key="brand">Brand</DropdownItem>
                            <DropdownItem key="vehicle_id">Vehicle ID</DropdownItem>
                            <DropdownItem key="customer_id">Customer ID</DropdownItem>
                            <DropdownItem key="ride_id">Ride ID</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>

            {/* Table */}
            {groupBy === "none" ? (
                <Card>
                    <CardBody>
                        <Table
                            aria-label="Rides table"
                            sortDescriptor={sortDescriptor}
                            onSortChange={setSortDescriptor}
                            topContentPlacement="outside"
                            bottomContent={
                                <div className="flex justify-between items-center py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-default-400">Rows:</span>
                                        <select
                                            className="bg-transparent outline-none text-sm"
                                            value={localRowsPerPage}
                                            onChange={(e) => {
                                                setLocalRowsPerPage(+e.target.value);
                                                setLocalPage(1);
                                            }}
                                        >
                                            {[5, 10, 15, 20].map((n) => (
                                                <option key={n} value={n}>
                                                    {n}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <Pagination page={localPage} total={totalLocalPages} onChange={setLocalPage} showControls />
                                </div>
                            }
                            bottomContentPlacement="outside"
                        >
                            <TableHeader columns={columns}>
                                {(c) => (
                                    <TableColumn key={c.uid} allowsSorting={c.sortable}>
                                        {c.name}
                                    </TableColumn>
                                )}
                            </TableHeader>
                            <TableBody emptyContent="No rides">
                                {pageRides.map((item) => (
                                    <TableRow key={`${item.ride_id}-${item.event_timestamp}-${JSON.stringify(item.property_values)}`}>
                                        {columns.map((col) => (
                                            <TableCell key={col.uid}>{cell(item, col.uid)}</TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>
            ) : (
                aggregatedGroups && (
                    <Card>
                        <CardBody>
                            <Table
                                aria-label="Aggregated Rides table"
                                sortDescriptor={aggregatedSortDescriptor}
                                onSortChange={setAggregatedSortDescriptor}
                                selectionMode="multiple"
                                selectionBehavior="toggle"
                                showSelectionCheckboxes
                                selectedKeys={aggSelectedKeys}
                                onSelectionChange={(newKeys) => {
                                    if (newKeys === "all") {
                                        setAggSelectedKeys(new Set(sortedAggregatedGroups.map((g) => g.group)));
                                    } else {
                                        const keys = newKeys instanceof Set ? newKeys : new Set(newKeys);
                                        setAggSelectedKeys(keys);
                                    }
                                }}
                            >
                                <TableHeader columns={aggregatedColumns}>
                                    {(c) => (
                                        <TableColumn
                                            key={c.uid}
                                            allowsSorting={c.sortable}
                                            className={c.uid === "count" ? "text-center" : ""}
                                        >
                                            {c.name}
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody emptyContent="No rides">
                                    {sortedPageAggregatedGroups.map((groupItem) => {
                                        const grp = groupItem.group;
                                        const expanded = expandedGroups.has(grp);
                                        return (
                                            <React.Fragment key={grp}>
                                                <TableRow key={grp}>
                                                    <TableCell className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            isIconOnly
                                                            variant="flat"
                                                            onPress={() =>
                                                                setExpandedGroups((prev) => {
                                                                    const next = new Set(prev);
                                                                    next.has(grp) ? next.delete(grp) : next.add(grp);
                                                                    return next;
                                                                })
                                                            }
                                                        >
                                                            {expanded ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                        </Button>
                                                        <span>{grp}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">{groupItem.count}</TableCell>
                                                </TableRow>
                                                {expanded &&
                                                    groupItem.rideGroups.map((rg) => {
                                                        const rideKey = `${grp}-${rg.rideId}`;
                                                        const rideExpanded = expandedRides.has(rideKey);
                                                        const rep = rg.rides[0];
                                                        return (
                                                            <React.Fragment key={rideKey}>
                                                                <TableRow key={rideKey} isDisabled>
                                                                    <TableCell className="flex items-center gap-2 pl-12">
                                                                        <Button
                                                                            size="sm"
                                                                            isIconOnly
                                                                            variant="flat"
                                                                            onPress={() => toggleRide(rideKey)}
                                                                        >
                                                                            {rideExpanded ? <RemoveIcon /> : <AddIcon />}
                                                                        </Button>
                                                                        <span>
                                                                            Ride ID: {rep.ride_id} | Brand: {rep.brand} | Vehicle:{" "}
                                                                            {rep.vehicle_id} | Customer: {rep.customer_id}
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell className="invisible" />
                                                                </TableRow>
                                                                {rideExpanded &&
                                                                    rg.rides.map((r, idx) => (
                                                                        <TableRow key={`detail-${rideKey}-${idx}`} isDisabled>
                                                                            <TableCell className="pl-24">
                                                                                <div className="flex items-center gap-4">
                                                                                    <span>
                                                                                        <strong>Timestamp:</strong>{" "}
                                                                                        {new Date(r.event_timestamp).toLocaleString()}
                                                                                    </span>
                                                                                    <span>
                                                                                        <strong>State:</strong> {r.state}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="mt-2">
                                                                                    <strong>Props:</strong>{" "}
                                                                                    {JSON.stringify(r.property_values)}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="hidden" />
                                                                        </TableRow>
                                                                    ))}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            <div className="flex justify-between items-center py-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-default-400">Groups per page:</span>
                                    <select
                                        className="bg-transparent outline-none text-sm"
                                        value={groupRowsPerPage}
                                        onChange={(e) => {
                                            setGroupRowsPerPage(+e.target.value);
                                            setGroupPage(1);
                                        }}
                                    >
                                        {[5, 10, 15, 20].map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Pagination page={groupPage} total={totalGroupPages} onChange={setGroupPage} showControls />
                            </div>
                        </CardBody>
                    </Card>
                )
            )}

            {/* Chart */}
            {visibleCharts.includes("brand") && (groupBy === "none" || aggSelectedKeys.size > 0) && (
                <Card className="mt-8">
                    <CardBody>
                        <Bar data={chartData} options={chartOptions} />
                    </CardBody>
                </Card>
            )}
        </div>
    );
}

export default function OurDataWrapper() {
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => setHasMounted(true), []);
    if (!hasMounted) return null;
    return (
        <div className="flex w-[100%] h-screen">
            <Sidebar className="w-[20%] h-full" />
            <div className="flex-1">
                <DataContent />
            </div>
        </div>
    );
}
