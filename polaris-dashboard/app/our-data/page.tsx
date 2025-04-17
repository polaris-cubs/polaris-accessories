// Full version with layout fixes, line chart by vehicle, and summary card added

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
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

// ------------ fetch helper ------------
const fetcher = async (page: number, pageSize: number) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    const res = await fetch(`http://localhost:8080/api/rides?${params.toString()}`);
    return res.json();
};

interface RidesResponse {
    Rows: any[];
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

/*
  DataContent supports:
  - Loading more rides.
  - Filtering and searching.
  - Grouping by one of: "none", "brand", "vehicle_id", "customer_id", or "ride_id".
  - Two-level grouping: within each aggregated group, rides are regrouped by ride_id.
  - Expanding a group shows the unique ride id rows; expanding a ride row shows all rows related to that ride id.
  - Pagination is added for both the detailed view and the aggregated view.
  - The aggregated table header sorts like the non-grouped table.
  - The unique ride rows in the aggregated table are now clickable.
*/
function DataContent() {
    // ---------- Load More / Fetch State ----------
    const [allRides, setAllRides] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10000;
    const [totalCount, setTotalCount] = useState(0);

    const loadPage = useCallback(
        async (page: number) => {
            const data: RidesResponse = await fetcher(page, pageSize);
            setTotalCount(data.TotalCount);
            if (page === 1) {
                setAllRides(data.Rows);
            } else {
                setAllRides((prev) => {
                    const seen = new Set(prev.map((r) => `${r.ride_id}-${r.event_timestamp}-${JSON.stringify(r.property_values)}`));
                    const unique = data.Rows.filter(
                        (r) => !seen.has(`${r.ride_id}-${r.event_timestamp}-${JSON.stringify(r.property_values)}`),
                    );
                    return [...prev, ...unique];
                });
            }
        },
        [pageSize],
    );

    useEffect(() => {
        loadPage(currentPage);
    }, [currentPage, loadPage]);

    const totalServerPages = Math.ceil(totalCount / pageSize);
    const canLoadMore = currentPage < totalServerPages;

    // ---------- Filters, Search and Sorting ----------
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
            const haystack =
                String(r.ride_id).toLowerCase() +
                r.state.toLowerCase() +
                r.vehicle_id.toLowerCase() +
                r.brand.toLowerCase() +
                String(r.customer_id).toLowerCase() +
                new Date(r.event_timestamp).toLocaleString().toLowerCase() +
                JSON.stringify(r.property_values).toLowerCase();
            return haystack.includes(lower);
        });
    }, [allRides, selectedState, selectedBrand, searchTerm]);

    const sortedRides = useMemo(() => {
        const { column, direction } = sortDescriptor;
        const arr = [...filteredRides];
        arr.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];
            if (column === "event_timestamp") {
                valA = new Date(a.event_timestamp).getTime();
                valB = new Date(b.event_timestamp).getTime();
            }
            const cmp = typeof valA === "number" && typeof valB === "number" ? valA - valB : String(valA).localeCompare(String(valB));
            return direction === "ascending" ? cmp : -cmp;
        });
        return arr;
    }, [filteredRides, sortDescriptor]);

    // ---------- Local Pagination for Detailed (Non-grouped) View ----------
    const [localPage, setLocalPage] = useState(1);
    const [localRowsPerPage, setLocalRowsPerPage] = useState(10);
    const totalLocalPages = Math.ceil(sortedRides.length / localRowsPerPage);
    const pageRides = useMemo(() => {
        const start = (localPage - 1) * localRowsPerPage;
        return sortedRides.slice(start, start + localRowsPerPage);
    }, [sortedRides, localPage, localRowsPerPage]);

    // ---------- Grouping / Aggregation ----------
    // groupBy: "none", "brand", "vehicle_id", "customer_id", or "ride_id"
    const [groupBy, setGroupBy] = useState<string>("none");
    // Reset aggregated groups page when groupBy changes.
    const [groupPage, setGroupPage] = useState(1);
    useEffect(() => {
        setGroupPage(1);
    }, [groupBy]);
    // expandedGroups tracks which aggregated groups (by group key) are expanded.
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    // expandedRides tracks which ride id groups (within a group) are expanded.
    const [expandedRides, setExpandedRides] = useState<Set<string>>(new Set());

    // Helper: toggle expansion of a ride (unique ride id) within a group.
    const toggleRide = (rideKey: string) => {
        setExpandedRides((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(rideKey)) {
                newSet.delete(rideKey);
            } else {
                newSet.add(rideKey);
            }
            return newSet;
        });
    };

    // Build two-level aggregated groups:
    //  - Top level groups by the groupBy field.
    //  - Within each top-level group, group rides by ride_id.
    const aggregatedGroups = useMemo(() => {
        if (groupBy === "none") return null;
        const groups: Record<string, RideRow[]> = {};
        for (const r of sortedRides) {
            const key = String(r[groupBy]);
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
        }
        return Object.entries(groups).map(([groupKey, rides]) => {
            const rideGroups: { rideId: number; rides: RideRow[] }[] = [];
            const rideMap = new Map<number, RideRow[]>();
            for (const ride of rides) {
                if (rideMap.has(ride.ride_id)) {
                    rideMap.get(ride.ride_id)!.push(ride);
                } else {
                    rideMap.set(ride.ride_id, [ride]);
                }
            }
            for (const [rideId, rideList] of rideMap.entries()) {
                rideGroups.push({ rideId, rides: rideList });
            }
            rideGroups.sort((a, b) => a.rideId - b.rideId);
            return {
                group: groupKey,
                rideGroups,
                count: rideGroups.length,
            };
        });
    }, [groupBy, sortedRides]);

    // ---------- Aggregated Groups Pagination ----------
    const [groupRowsPerPage, setGroupRowsPerPage] = useState(10);
    const totalGroupPages = aggregatedGroups ? Math.ceil(aggregatedGroups.length / groupRowsPerPage) : 1;
    const pageAggregatedGroups = useMemo(() => {
        return aggregatedGroups ? aggregatedGroups.slice((groupPage - 1) * groupRowsPerPage, groupPage * groupRowsPerPage) : [];
    }, [aggregatedGroups, groupPage, groupRowsPerPage]);

    // ---------- Aggregated Header Sorting for Grouped Table ----------
    // Define aggregated columns similarly to the non-grouped table.
    const aggregatedColumns = useMemo(() => {
        if (!groupBy || groupBy === "none") return [];
        return [
            { name: groupBy.charAt(0).toUpperCase() + groupBy.slice(1), uid: "group", sortable: true },
            { name: "Count", uid: "count", sortable: true },
        ];
    }, [groupBy]);

    const [aggregatedSortDescriptor, setAggregatedSortDescriptor] = useState<SortDescriptor>({
        column: "group",
        direction: "ascending",
    });

    const sortedAggregatedGroups = useMemo(() => {
        if (!aggregatedGroups) return [];
        const { column, direction } = aggregatedSortDescriptor;
        return [...aggregatedGroups].sort((a, b) => {
            let valA: any, valB: any;
            if (column === "group") {
                valA = a.group;
                valB = b.group;
            } else if (column === "count") {
                valA = a.count;
                valB = b.count;
            } else {
                valA = a.group;
                valB = b.group;
            }
            const cmp = typeof valA === "number" && typeof valB === "number" ? valA - valB : String(valA).localeCompare(String(valB));
            return direction === "ascending" ? cmp : -cmp;
        });
    }, [aggregatedGroups, aggregatedSortDescriptor]);

    const sortedPageAggregatedGroups = useMemo(() => {
        return sortedAggregatedGroups.slice((groupPage - 1) * groupRowsPerPage, groupPage * groupRowsPerPage);
    }, [sortedAggregatedGroups, groupPage, groupRowsPerPage]);

    // ---------- Dropdown Data ----------
    const distinctStates = [...new Set(allRides.map((r) => r.state))];
    const distinctBrands = [...new Set(allRides.map((r) => r.brand))];
    const singleSel = (v: string | null) => (v ? new Set([v]) : new Set([""]));

    // ---------- Chart Data: Unique Ride Counts per Brand ----------
    const uniqueRides = useMemo(() => {
        const rideMap = new Map<number, RideRow>();
        for (const r of sortedRides) {
            if (!rideMap.has(r.ride_id)) {
                rideMap.set(r.ride_id, r);
            }
        }
        return Array.from(rideMap.values());
    }, [sortedRides]);

    const brandCounts = useMemo(() => {
        const map: Record<string, number> = {};
        for (const r of uniqueRides) {
            map[r.brand] = (map[r.brand] || 0) + 1;
        }
        return Object.entries(map).map(([brand, count]) => ({ brand, count }));
    }, [uniqueRides]);

    const chartData = {
        labels: brandCounts.map((b) => b.brand),
        datasets: [{ label: "Unique Rides", data: brandCounts.map((b) => b.count) }],
    };

    const chartOptions: ChartOptions<"bar"> = {
        responsive: true,
        plugins: { legend: { position: "top" }, title: { display: true, text: "Brand Usage" } },
    };

    // ---------- Selection for Detailed (Non-grouped) View ----------
    const [selectedKeys, setSelectedKeys] = useState<Set<React.Key>>(new Set());

    // ---------- Cell Renderer for Detailed Table ----------
    const cell = (r: RideRow, key: React.Key) => {
        if (key === "event_timestamp") return new Date(r.event_timestamp).toLocaleString();
        if (key === "property_values") return JSON.stringify(r.property_values);
        return r[key as keyof RideRow];
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-center mb-6">Our Data Dashboard</h1>

            {/* Load More Bar */}
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

            {/* Top Controls: Search, Filters, and Group By */}
            <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                <div className="flex flex-wrap gap-2">
                    <Input
                        placeholder="Search..."
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

                    {/* State dropdown */}
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
                                const v = k.values().next().value;
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

                    {/* Brand dropdown */}
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
                                const v = k.values().next().value;
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

                {/* Group By dropdown */}
                <Dropdown>
                    <DropdownTrigger>
                        <Button size="sm" variant="flat">
                            Group By: {groupBy !== "none" ? groupBy : "None"}
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                        selectionMode="single"
                        selectedKeys={new Set([groupBy])}
                        onSelectionChange={(k) => {
                            // Use nullish coalescing to force a string; if undefined, fallback to "none"
                            const selected = k.values().next().value ?? "none";
                            setGroupBy(selected);
                        }}
                    >
                        <DropdownItem key="none">None</DropdownItem>
                        <DropdownItem key="brand">Brand</DropdownItem>
                        <DropdownItem key="vehicle_id">Vehicle ID</DropdownItem>
                        <DropdownItem key="customer_id">Customer ID</DropdownItem>
                        <DropdownItem key="ride_id">Ride ID</DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </div>

            {/* Render Detailed Table OR Aggregated (Grouped) Table */}
            {groupBy === "none" ? (
                // Detailed Table View with Pagination and Row Selection
                <Card>
                    <CardBody>
                        <Table
                            aria-label="Rides table"
                            sortDescriptor={sortDescriptor}
                            onSortChange={setSortDescriptor}
                            selectionMode="multiple"
                            selectionBehavior="toggle"
                            selectedKeys={selectedKeys}
                            onSelectionChange={setSelectedKeys}
                            topContentPlacement="outside"
                            bottomContent={
                                <div className="flex justify-between items-center py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-default-400">Rows per page:</span>
                                        <select
                                            className="bg-transparent outline-none text-sm"
                                            value={localRowsPerPage}
                                            onChange={(e) => {
                                                setLocalRowsPerPage(Number(e.target.value));
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
            ) : aggregatedGroups ? (
                // Aggregated/Grouped Table with Nested Expansion for Unique Rides and Their Details
                <Card>
                    <CardBody>
                        <Table
                            aria-label="Aggregated Rides table"
                            sortDescriptor={aggregatedSortDescriptor}
                            onSortChange={setAggregatedSortDescriptor}
                        >
                            <TableHeader columns={aggregatedColumns}>
                                {(c) => (
                                    <TableColumn key={c.uid} allowsSorting={c.sortable} className={c.uid === "count" ? "text-center" : ""}>
                                        {c.name}
                                    </TableColumn>
                                )}
                            </TableHeader>
                            <TableBody emptyContent="No rides">
                                {sortedPageAggregatedGroups.map((groupItem) => {
                                    const groupExpanded = expandedGroups.has(groupItem.group);
                                    return (
                                        <React.Fragment key={`group-${groupItem.group}`}>
                                            {/* Group Header Row */}
                                            <TableRow>
                                                <TableCell className="align-middle flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        isIconOnly
                                                        variant="flat"
                                                        onPress={() =>
                                                            setExpandedGroups((prev) => {
                                                                const newSet = new Set(prev);
                                                                if (newSet.has(groupItem.group)) {
                                                                    newSet.delete(groupItem.group);
                                                                } else {
                                                                    newSet.add(groupItem.group);
                                                                }
                                                                return newSet;
                                                            })
                                                        }
                                                    >
                                                        {groupExpanded ? (
                                                            <VisibilityOffIcon fontSize="small" />
                                                        ) : (
                                                            <VisibilityIcon fontSize="small" />
                                                        )}
                                                    </Button>
                                                    <span>{groupItem.group}</span>
                                                </TableCell>
                                                <TableCell className="text-center">{groupItem.count}</TableCell>
                                            </TableRow>
                                            {groupExpanded &&
                                                groupItem.rideGroups.map((rideGroup) => {
                                                    const rideKey = `${groupItem.group}-${rideGroup.rideId}`;
                                                    const rideExpanded = expandedRides.has(rideKey);
                                                    const rep = rideGroup.rides[0];

                                                    return (
                                                        <React.Fragment key={rideKey}>
                                                            {/* Ride Summary Row: only the icon is clickable */}
                                                            <TableRow>
                                                                <TableCell className="align-middle flex items-center gap-2 pl-12">
                                                                    <Button
                                                                        size="sm"
                                                                        isIconOnly
                                                                        variant="flat"
                                                                        onPress={() => toggleRide(rideKey)}
                                                                    >
                                                                        {rideExpanded ? (
                                                                            <RemoveIcon fontSize="small" />
                                                                        ) : (
                                                                            <AddIcon fontSize="small" />
                                                                        )}
                                                                    </Button>
                                                                    <span>
                                                                        Ride ID: {rep.ride_id} | Brand: {rep.brand} | Vehicle:{" "}
                                                                        {rep.vehicle_id} | Customer: {rep.customer_id}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="invisible" />
                                                            </TableRow>

                                                            {/* Ride Detail Rows */}
                                                            {rideExpanded &&
                                                                rideGroup.rides.map((r, idx) => (
                                                                    <TableRow key={`ride-${rideKey}-details-${idx}`}>
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
                                                                                <strong>Props:</strong> {JSON.stringify(r.property_values)}
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
                        {/* Aggregated Groups Pagination Controls */}
                        <div className="flex justify-between items-center py-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-default-400">Groups per page:</span>
                                <select
                                    className="bg-transparent outline-none text-sm"
                                    value={groupRowsPerPage}
                                    onChange={(e) => {
                                        setGroupRowsPerPage(Number(e.target.value));
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
            ) : null}

            {/* Chart Section (Unchanged) */}
            {sortedRides.length > 0 && (
                <Card className="mt-8">
                    <CardBody>
                        <Bar data={chartData} options={chartOptions} />
                    </CardBody>
                </Card>
            )}
        </div>
    );
}

/*
  OurDataWrapper delays rendering DataContent until after mounting
  so that hook order remains consistent and hydration errors are avoided.
*/
export default function OurDataWrapper() {
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => {
        setHasMounted(true);
    }, []);
    if (!hasMounted) {
        return null;
    }
    return (
        <div className="flex w-[100%] h-screen">
            {/* Sidebar on the left */}
            <Sidebar className="w-[20%] h-full" />

            {/* Main content area */}
            <div>
                <DataContent />
            </div>
        </div>
    );
}
