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
import { Bar, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
} from "chart.js";

import Sidebar from "@/components/sidebar/sidebar";

// register both bar- and line-specific elements
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

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

// near the top, alongside your imports
const PROP_META: Record<number, { label: string; unit: string }> = {
    1: { label: "winch_power", unit: " AMPS" },
    2: { label: "audio_system_volume_level", unit: " %" },
    3: { label: "spreader_state", unit: "" }, // these are state descs
    4: { label: "chase_light_state", unit: " AMPS" },
    5: { label: "vehicle_engine_speed", unit: " MPH" },
    6: { label: "plow_state", unit: "" },
    7: { label: "light_bar_state", unit: " AMPS" },
    8: { label: "spreader_fill", unit: " % FULL" },
};

export function DataContent() {
    // ------------ Fetch & pagination ------------
    const [allRides, setAllRides] = useState<RideRow[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10000;
    const [totalCount, setTotalCount] = useState(0);

    const loadPage = useCallback(
        async (page: number) => {
            const params = new URLSearchParams({
                page: String(page),
                page_size: String(pageSize),
            });
            const res = await fetch(`http://localhost:8080/api/rides?${params}`);
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
        const start = (localPage - 1) * localRowsPerPage;

        return sortedRides.slice(start, start + localRowsPerPage);
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
            const rideGroups = Array.from(rideMap, ([rideId, arr]) => ({
                rideId,
                rides: arr,
            }));

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
            {
                name: groupBy.charAt(0).toUpperCase() + groupBy.slice(1),
                uid: "group",
                sortable: true,
            },
            { name: "Count", uid: "count", sortable: true },
        ];
    }, [groupBy]);

    const sortedAggregatedGroups = useMemo(() => {
        if (!aggregatedGroups) return [];
        const { column, direction } = aggregatedSortDescriptor;

        return [...aggregatedGroups].sort((a, b) => {
            const va: any = column === "count" ? a.count : a.group;
            const vb: any = column === "count" ? b.count : b.group;
            const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));

            return direction === "ascending" ? cmp : -cmp;
        });
    }, [aggregatedGroups, aggregatedSortDescriptor]);

    const [groupRowsPerPage, setGroupRowsPerPage] = useState(10);
    const totalGroupPages = Math.ceil(sortedAggregatedGroups.length / groupRowsPerPage);
    const sortedPageAggregatedGroups = useMemo(
        () => sortedAggregatedGroups.slice((groupPage - 1) * groupRowsPerPage, groupPage * groupRowsPerPage),
        [sortedAggregatedGroups, groupPage, groupRowsPerPage],
    );

    // ------------ Selection & charts ------------
    const [aggSelectedKeys, setAggSelectedKeys] = useState<Set<React.Key>>(new Set());

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

    // Brand chart data
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

    // format times for category axis
    const plowUsageByHour = useMemo(() => {
        const counts: Record<number, number> = {};

        const rideMap = new Map<number, RideRow[]>();

        sortedRides
            .filter((r) => selectedRideIds.has(r.ride_id))
            .forEach((r) => {
                if (!rideMap.has(r.ride_id)) {
                    rideMap.set(r.ride_id, []);
                }
                rideMap.get(r.ride_id)!.push(r);
            });

        for (let [rideId, rows] of rideMap) {
            const plowUpTimestamps = rows
                .filter((r) => Array.isArray(r.property_values) && r.property_values.some((p: any) => p.id === 6 && p.value === "UP"))
                .map((r) => new Date(r.event_timestamp).getTime());

            if (plowUpTimestamps.length > 0) {
                const minTime = Math.min(...plowUpTimestamps);
                const maxTime = Math.max(...plowUpTimestamps);

                const minHour = new Date(minTime).getHours();
                const maxHour = new Date(maxTime).getHours();

                for (let h = minHour; h <= maxHour; h++) {
                    counts[h] = (counts[h] || 0) + 1;
                }
            }
        }

        const result = Array.from({ length: 24 }, (_, h) => ({
            hour: `${h}:00`,
            count: counts[h] || 0,
        }));

        console.log("🕓 Plow usage spread across hours:", result);

        return result;
    }, [sortedRides, selectedRideIds]);

    const plowLineData = {
        labels: plowUsageByHour.map((x) => x.hour),
        datasets: [
            {
                label: "Snow Plow Usage by Hour",
                data: plowUsageByHour.map((x) => x.count),
                borderColor: "rgba(54, 162, 235, 1)",
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                tension: 0.4,
                fill: true,
                pointBackgroundColor: "rgba(54, 162, 235, 1)",
            },
        ],
    };

    const plowLineOptions: ChartOptions<"line"> = {
        responsive: true,
        animation: false,
        plugins: {
            legend: { position: "top" },
            title: {
                display: true,
                text: "Snow Plow Usage by Time of Day",
            },
        },
        scales: {
            x: {
                title: { display: true, text: "Time of Day" },
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Number of Snow Plow Uses",
                },
            },
        },
    };

    const spreaderUsageByHourLevels = useMemo(() => {
        const counts: Record<string, Record<number, number>> = {
            LOW: {},
            MEDIUM: {},
            HIGH: {},
        };

        const rideMap = new Map<number, RideRow[]>();

        sortedRides
            .filter((r) => selectedRideIds.has(r.ride_id))
            .forEach((r) => {
                if (!rideMap.has(r.ride_id)) rideMap.set(r.ride_id, []);
                rideMap.get(r.ride_id)!.push(r);
            });

        for (const rows of rideMap.values()) {
            rows.forEach((r) => {
                const timestamp = new Date(r.event_timestamp);
                const hour = timestamp.getHours();

                if (!Array.isArray(r.property_values)) return;

                r.property_values.forEach((p: any) => {
                    if (p.id === 3 && ["LOW", "MEDIUM", "HIGH"].includes(p.value)) {
                        counts[p.value][hour] = (counts[p.value][hour] || 0) + 1;
                    }
                });
            });
        }

        return Array.from({ length: 24 }, (_, h) => ({
            hour: `${h}:00`,
            LOW: counts.LOW[h] || 0,
            MEDIUM: counts.MEDIUM[h] || 0,
            HIGH: counts.HIGH[h] || 0,
        }));
    }, [sortedRides, selectedRideIds]);

    const spreaderLineData = {
        labels: spreaderUsageByHourLevels.map((x) => x.hour),
        datasets: [
            {
                label: "LOW",
                data: spreaderUsageByHourLevels.map((x) => x.LOW),
                borderColor: "rgba(54, 162, 235, 1)",
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                fill: true,
                tension: 0.4,
            },
            {
                label: "MEDIUM",
                data: spreaderUsageByHourLevels.map((x) => x.MEDIUM),
                borderColor: "rgba(255, 206, 86, 1)",
                backgroundColor: "rgba(255, 206, 86, 0.2)",
                fill: true,
                tension: 0.4,
            },
            {
                label: "HIGH",
                data: spreaderUsageByHourLevels.map((x) => x.HIGH),
                borderColor: "rgba(255, 99, 132, 1)",
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const spreaderLineOptions: ChartOptions<"line"> = {
        responsive: true,
        animation: false,
        plugins: {
            legend: { position: "top" },
            title: {
                display: true,
                text: "Spreader Usage by Intensity and Hour",
            },
        },
        scales: {
            x: {
                title: { display: true, text: "Time of Day" },
            },
            y: {
                beginAtZero: true,
                title: { display: true, text: "Usage Events" },
            },
        },
    };

    // Average winch power (AMPS) by hour
    const winchAmpsByHour = useMemo(() => {
        const sums: Record<number, number> = {};
        const counts: Record<number, number> = {};

        sortedRides
            .filter((r) => selectedRideIds.has(r.ride_id))
            .forEach((r) => {
                const hour = new Date(r.event_timestamp).getHours();
                const props = Array.isArray(r.property_values) ? r.property_values : [];

                props
                    .filter((p: any) => p.id === 1) // winch_power entries
                    .forEach((p: any) => {
                        const amps = Number(p.value);

                        if (!isNaN(amps)) {
                            sums[hour] = (sums[hour] || 0) + amps;
                            counts[hour] = (counts[hour] || 0) + 1;
                        }
                    });
            });

        return Array.from({ length: 24 }, (_, h) => ({
            hour: `${h}:00`,
            avgAmps: counts[h] ? sums[h] / counts[h] : 0,
        }));
    }, [sortedRides, selectedRideIds]);

    const winchLineData = {
        labels: winchAmpsByHour.map((x) => x.hour),
        datasets: [
            {
                label: "Avg. Winch Power (AMPS)",
                data: winchAmpsByHour.map((x) => x.avgAmps),
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "rgba(75, 192, 192, 1)",
            },
        ],
    };

    const winchLineOptions: ChartOptions<"line"> = {
        responsive: true,
        animation: false,
        plugins: {
            legend: { position: "top" },
            title: {
                display: true,
                text: "Winch Power (AMPS) by Time of Day",
            },
        },
        scales: {
            x: {
                title: { display: true, text: "Hour of Day" },
            },
            y: {
                beginAtZero: true,
                title: { display: true, text: "Average AMPS" },
            },
        },
    };

    // Average light‑bar AMPS by hour
    const lightBarAmpsByHour = useMemo(() => {
        const sums: Record<number, number> = {};
        const counts: Record<number, number> = {};

        sortedRides
            .filter((r) => selectedRideIds.has(r.ride_id))
            .forEach((r) => {
                const hour = new Date(r.event_timestamp).getHours();
                const props = Array.isArray(r.property_values) ? r.property_values : [];

                props
                    .filter((p: any) => p.id === 7) // light‑bar entries
                    .forEach((p: any) => {
                        const amps = Number(p.value);

                        if (!isNaN(amps)) {
                            sums[hour] = (sums[hour] || 0) + amps;
                            counts[hour] = (counts[hour] || 0) + 1;
                        }
                    });
            });

        return Array.from({ length: 24 }, (_, h) => ({
            hour: `${h}:00`,
            avgAmps: counts[h] ? sums[h] / counts[h] : 0,
        }));
    }, [sortedRides, selectedRideIds]);

    const lightBarLineData = {
        labels: lightBarAmpsByHour.map((x) => x.hour),
        datasets: [
            {
                label: "Avg. Light‑Bar Power (AMPS)",
                data: lightBarAmpsByHour.map((x) => x.avgAmps),
                borderColor: "rgba(153, 102, 255, 1)",
                backgroundColor: "rgba(153, 102, 255, 0.2)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "rgba(153, 102, 255, 1)",
            },
        ],
    };

    const lightBarLineOptions: ChartOptions<"line"> = {
        responsive: true,
        animation: false,
        plugins: {
            legend: { position: "top" },
            title: {
                display: true,
                text: "Light‑Bar Power (AMPS) by Time of Day",
            },
        },
        scales: {
            x: {
                title: { display: true, text: "Hour of Day" },
            },
            y: {
                beginAtZero: true,
                title: { display: true, text: "Average AMPS" },
            },
        },
    };

    // Average chase‑light AMPS by hour
    const chaseLightAmpsByHour = useMemo(() => {
        const sums: Record<number, number> = {};
        const counts: Record<number, number> = {};

        sortedRides
            .filter((r) => selectedRideIds.has(r.ride_id))
            .forEach((r) => {
                const hour = new Date(r.event_timestamp).getHours();
                const props = Array.isArray(r.property_values) ? r.property_values : [];

                props
                    .filter((p: any) => p.id === 4) // chase_light_state entries
                    .forEach((p: any) => {
                        const amps = Number(p.value);

                        if (!isNaN(amps)) {
                            sums[hour] = (sums[hour] || 0) + amps;
                            counts[hour] = (counts[hour] || 0) + 1;
                        }
                    });
            });

        return Array.from({ length: 24 }, (_, h) => ({
            hour: `${h}:00`,
            avgAmps: counts[h] ? sums[h] / counts[h] : 0,
        }));
    }, [sortedRides, selectedRideIds]);

    const chaseLightLineData = {
        labels: chaseLightAmpsByHour.map((x) => x.hour),
        datasets: [
            {
                label: "Avg. Chase‑Light Power (AMPS)",
                data: chaseLightAmpsByHour.map((x) => x.avgAmps),
                borderColor: "rgba(255, 159, 64, 1)",
                backgroundColor: "rgba(255, 159, 64, 0.2)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "rgba(255, 159, 64, 1)",
            },
        ],
    };

    const chaseLightLineOptions: ChartOptions<"line"> = {
        responsive: true,
        animation: false,
        plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Chase‑Light Power (AMPS) by Time of Day" },
        },
        scales: {
            x: { title: { display: true, text: "Hour of Day" } },
            y: { beginAtZero: true, title: { display: true, text: "Average AMPS" } },
        },
    };

    // 1️⃣ compute avg volume % by hour
    const audioVolByHour = useMemo(() => {
        const sums: Record<number, number> = {};
        const counts: Record<number, number> = {};

        sortedRides
            .filter((r) => selectedRideIds.has(r.ride_id))
            .forEach((r) => {
                const hour = new Date(r.event_timestamp).getHours();
                const props = Array.isArray(r.property_values) ? r.property_values : [];

                props
                    .filter((p: any) => p.id === 2)
                    .forEach((p: any) => {
                        const pct = Number(p.value);

                        if (!isNaN(pct)) {
                            sums[hour] = (sums[hour] || 0) + pct;
                            counts[hour] = (counts[hour] || 0) + 1;
                        }
                    });
            });

        return Array.from({ length: 24 }, (_, h) => ({
            hour: `${h}:00`,
            avgVol: counts[h] ? sums[h] / counts[h] : 0,
        }));
    }, [sortedRides, selectedRideIds]);

    // 2️⃣ chart data & options
    const audioVolLineData = {
        labels: audioVolByHour.map((x) => x.hour),
        datasets: [
            {
                label: "Avg. Audio Volume (%)",
                data: audioVolByHour.map((x) => x.avgVol),
                borderColor: "rgba(75,192,192,1)",
                backgroundColor: "rgba(75,192,192,0.2)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "rgba(75,192,192,1)",
            },
        ],
    };

    const audioVolLineOptions: ChartOptions<"line"> = {
        responsive: true,
        animation: false,
        plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Audio System Volume (%) by Hour" },
        },
        scales: {
            x: { title: { display: true, text: "Hour of Day" } },
            y: {
                beginAtZero: true,
                max: 100,
                title: { display: true, text: "Volume (%)" },
            },
        },
    };

    // 1️⃣ compute avg speed MPH by hour
    const engineSpeedByHour = useMemo(() => {
        const sums: Record<number, number> = {};
        const counts: Record<number, number> = {};

        sortedRides
            .filter((r) => selectedRideIds.has(r.ride_id))
            .forEach((r) => {
                const hour = new Date(r.event_timestamp).getHours();
                const props = Array.isArray(r.property_values) ? r.property_values : [];

                props
                    .filter((p: any) => p.id === 5)
                    .forEach((p: any) => {
                        const mph = Number(p.value);

                        if (!isNaN(mph)) {
                            sums[hour] = (sums[hour] || 0) + mph;
                            counts[hour] = (counts[hour] || 0) + 1;
                        }
                    });
            });

        return Array.from({ length: 24 }, (_, h) => ({
            hour: `${h}:00`,
            avgSpeed: counts[h] ? sums[h] / counts[h] : 0,
        }));
    }, [sortedRides, selectedRideIds]);

    // 2️⃣ chart data & options
    const engineSpeedLineData = {
        labels: engineSpeedByHour.map((x) => x.hour),
        datasets: [
            {
                label: "Avg. Engine Speed (MPH)",
                data: engineSpeedByHour.map((x) => x.avgSpeed),
                borderColor: "rgba(54,162,235,1)",
                backgroundColor: "rgba(54,162,235,0.2)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "rgba(54,162,235,1)",
            },
        ],
    };

    const engineSpeedLineOptions: ChartOptions<"line"> = {
        responsive: true,
        animation: false,
        plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Engine Speed (MPH) by Hour" },
        },
        scales: {
            x: { title: { display: true, text: "Hour of Day" } },
            y: {
                beginAtZero: true,
                title: { display: true, text: "Speed (MPH)" },
            },
        },
    };

    // 1️⃣ compute avg fill % by hour
    const spreaderFillByHour = useMemo(() => {
        const sums: Record<number, number> = {};
        const counts: Record<number, number> = {};

        sortedRides
            .filter((r) => selectedRideIds.has(r.ride_id))
            .forEach((r) => {
                const hour = new Date(r.event_timestamp).getHours();
                const props = Array.isArray(r.property_values) ? r.property_values : [];

                props
                    .filter((p: any) => p.id === 8)
                    .forEach((p: any) => {
                        const pct = Number(p.value);

                        if (!isNaN(pct)) {
                            sums[hour] = (sums[hour] || 0) + pct;
                            counts[hour] = (counts[hour] || 0) + 1;
                        }
                    });
            });

        return Array.from({ length: 24 }, (_, h) => ({
            hour: `${h}:00`,
            avgFill: counts[h] ? sums[h] / counts[h] : 0,
        }));
    }, [sortedRides, selectedRideIds]);

    // 2️⃣ chart data & options
    const spreaderFillLineData = {
        labels: spreaderFillByHour.map((x) => x.hour),
        datasets: [
            {
                label: "Avg. Spreader Fill (%)",
                data: spreaderFillByHour.map((x) => x.avgFill),
                borderColor: "rgba(255,159,64,1)",
                backgroundColor: "rgba(255,159,64,0.2)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "rgba(255,159,64,1)",
            },
        ],
    };

    const spreaderFillLineOptions: ChartOptions<"line"> = {
        responsive: true,
        animation: false,
        plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Spreader Fill (%) by Hour" },
        },
        scales: {
            x: { title: { display: true, text: "Hour of Day" } },
            y: {
                beginAtZero: true,
                max: 100,
                title: { display: true, text: "Fill (%)" },
            },
        },
    };

    // Dropdown
    const distinctStates = Array.from(new Set(allRides.map((r) => r.state)));
    const distinctBrands = Array.from(new Set(allRides.map((r) => r.brand)));
    const singleSel = (v: string | null) => (v ? new Set([v]) : new Set([""]));

    const graphOptions = [
        { key: "brand", label: "Brand Usage" },
        { key: "snow_plow_time_of_day", label: "Snow Plow Usage by Time of Day" },
        { key: "spreader_time_of_day", label: "Spreader Usage by Time of Day" },
        { key: "winch_time_of_day", label: "Winch Power by Time of Day" },
        { key: "light_bar_time_of_day", label: "Light‑Bar Power by Time of Day" },
        { key: "chase_light_time_of_day", label: "Chase‑Light Power by Time of Day" },
        { key: "audio_volume_time_of_day", label: "Audio Volume (%) by Time of Day" },
        { key: "engine_speed_time_of_day", label: "Engine Speed (MPH) by Time of Day" },
        { key: "spreader_fill_time_of_day", label: "Spreader Fill (%) by Time of Day" },
    ];
    const [visibleCharts, setVisibleCharts] = useState<string[]>(graphOptions.map((o) => o.key));

    // cell renderer
    const cell = (r: RideRow, key: React.Key) => {
        if (key === "event_timestamp") return new Date(r.event_timestamp).toLocaleString();

        if (key === "property_values") {
            if (!Array.isArray(r.property_values) || r.property_values.length === 0) return "–";

            return r.property_values
                .map((p: any) => {
                    const meta = PROP_META[p.id] || { label: `id:${p.id}`, unit: "" };

                    return `${meta.label}: ${p.value}${meta.unit}`;
                })
                .join("; ");
        }

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
                        isClearable
                        className="max-w-[200px]"
                        placeholder="Search…"
                        value={searchTerm}
                        variant="bordered"
                        onClear={() => setSearchTerm("")}
                        onValueChange={(val) => {
                            setSearchTerm(val || "");
                            setLocalPage(1);
                        }}
                    />
                    <Dropdown>
                        <DropdownTrigger>
                            <Button size="sm" variant="flat">
                                {selectedState ?? "State"}
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            selectedKeys={singleSel(selectedState)}
                            selectionMode="single"
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
                            selectedKeys={singleSel(selectedBrand)}
                            selectionMode="single"
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
                            selectedKeys={new Set(visibleCharts)}
                            selectionMode="multiple"
                            onSelectionChange={(keys) => {
                                // keys is always a Set here
                                const ks = keys as Set<string>;

                                if (ks.has("toggle")) {
                                    // user clicked our special toggle item
                                    setVisibleCharts(visibleCharts.length === graphOptions.length ? [] : graphOptions.map((o) => o.key));
                                } else {
                                    // normal chart toggles
                                    setVisibleCharts(Array.from(ks));
                                }
                            }}
                        >
                            <DropdownItem key="toggle">
                                {visibleCharts.length === graphOptions.length ? "Deselect All" : "Select All"}
                            </DropdownItem>
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
                            selectedKeys={new Set([groupBy])}
                            selectionMode="single"
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
                                    <Pagination showControls page={localPage} total={totalLocalPages} onChange={setLocalPage} />
                                </div>
                            }
                            bottomContentPlacement="outside"
                            sortDescriptor={sortDescriptor}
                            topContentPlacement="outside"
                            onSortChange={setSortDescriptor}
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
                                showSelectionCheckboxes
                                aria-label="Aggregated Rides table"
                                selectedKeys={aggSelectedKeys}
                                selectionBehavior="toggle"
                                selectionMode="multiple"
                                sortDescriptor={aggregatedSortDescriptor}
                                onSelectionChange={(newKeys) => {
                                    if (newKeys === "all") {
                                        setAggSelectedKeys(new Set(sortedAggregatedGroups.map((g) => g.group)));
                                    } else {
                                        setAggSelectedKeys(newKeys instanceof Set ? newKeys : new Set(newKeys));
                                    }
                                }}
                                onSortChange={setAggregatedSortDescriptor}
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
                                                            isIconOnly
                                                            size="sm"
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
                                                                            isIconOnly
                                                                            size="sm"
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
                                                                                    <strong>Props:</strong> {cell(r, "property_values")}
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
                                <Pagination showControls page={groupPage} total={totalGroupPages} onChange={setGroupPage} />
                            </div>
                        </CardBody>
                    </Card>
                )
            )}

            {/* Charts */}
            {visibleCharts.includes("brand") && (
                <Card className="mt-8">
                    <CardBody>
                        <Bar data={chartData} options={chartOptions} />
                    </CardBody>
                </Card>
            )}
            {visibleCharts.includes("snow_plow_time_of_day") && (
                <Card className="mt-8">
                    <CardBody>
                        <Line data={plowLineData} options={plowLineOptions} />
                    </CardBody>
                </Card>
            )}
            {visibleCharts.includes("spreader_time_of_day") && (
                <Card className="mt-8">
                    <CardBody>
                        <Line data={spreaderLineData} options={spreaderLineOptions} />
                    </CardBody>
                </Card>
            )}
            {visibleCharts.includes("winch_time_of_day") && (
                <Card className="mt-8">
                    <CardBody>
                        <Line data={winchLineData} options={winchLineOptions} />
                    </CardBody>
                </Card>
            )}
            {visibleCharts.includes("light_bar_time_of_day") && (
                <Card className="mt-8">
                    <CardBody>
                        <Line data={lightBarLineData} options={lightBarLineOptions} />
                    </CardBody>
                </Card>
            )}
            {visibleCharts.includes("chase_light_time_of_day") && (
                <Card className="mt-8">
                    <CardBody>
                        <Line data={chaseLightLineData} options={chaseLightLineOptions} />
                    </CardBody>
                </Card>
            )}
            {visibleCharts.includes("audio_volume_time_of_day") && (
                <Card className="mt-8">
                    <CardBody>
                        <Line data={audioVolLineData} options={audioVolLineOptions} />
                    </CardBody>
                </Card>
            )}
            {visibleCharts.includes("engine_speed_time_of_day") && (
                <Card className="mt-8">
                    <CardBody>
                        <Line data={engineSpeedLineData} options={engineSpeedLineOptions} />
                    </CardBody>
                </Card>
            )}
            {visibleCharts.includes("spreader_fill_time_of_day") && (
                <Card className="mt-8">
                    <CardBody>
                        <Line data={spreaderFillLineData} options={spreaderFillLineOptions} />
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
