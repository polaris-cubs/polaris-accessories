"use client";

import React, { useEffect, useState } from "react";
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

import Sidebar from "@/components/sidebar/sidebar";
import "@/app/my-data/subpages/audio/audio.css";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

type TimeSeriesData = {
  ride_date: string;
  rides: number;
};

type VehicleSummary = {
  brand: string;
  rides: number;
  vehicles: number;
};

type AccessorySummary = {
  state: string;
  property_name: string;
  usage_count: number;
};

export default function Audio() {
    const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
    const [vehicleData, setVehicleData] = useState<VehicleSummary[]>([]);
    const [accessoryData, setAccessoryData] = useState<AccessorySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [timeSeriesRes, vehicleRes, accessoryRes] = await Promise.all([
                    fetch("http://localhost:8080/api/time-series"),
                    fetch("http://localhost:8080/api/vehicle-summary"),
                    fetch("http://localhost:8080/api/accessory-summary"),
                ]);

                if (!timeSeriesRes.ok || !vehicleRes.ok || !accessoryRes.ok) {
                    throw new Error("Failed to fetch data");
                }

                const [timeSeriesJson, vehicleJson, accessoryJson] = await Promise.all([
                    timeSeriesRes.json(),
                    vehicleRes.json(),
                    accessoryRes.json(),
                ]);

                setTimeSeriesData(timeSeriesJson);
                setVehicleData(vehicleJson);
                setAccessoryData(accessoryJson);
                setLoading(false);
            } catch (err) {
                console.error("Error in fetchData:", err);
                setError(err instanceof Error ? err.message : "An error occurred");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="audio-container">
                <Sidebar />
                <div className="main-content">
                    <div className="loading">Loading data...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="audio-container">
                <Sidebar />
                <div className="main-content">
                    <div className="error">Error: {error}</div>
                </div>
            </div>
        );
    }

    const seasonalData = timeSeriesData.reduce((acc, curr) => {
        const date = new Date(curr.ride_date);
        const year = date.getFullYear();
        const season = `${year}`;

        if (!acc[season]) {
            acc[season] = { totalUses: 0, customerCount: 0 };
        }

        acc[season].totalUses += curr.rides;
        acc[season].customerCount += 1;

        return acc;
    }, {} as Record<string, { totalUses: number; customerCount: number }>);

    const seasonalChartData = {
        labels: Object.keys(seasonalData),
        datasets: [
            {
                label: "Average Uses per Customer",
                data: Object.values(seasonalData).map(
                    (d) => d.totalUses / d.customerCount
                ),
                backgroundColor: "rgba(153, 102, 255, 0.6)",
                borderColor: "rgba(153, 102, 255, 1)",
                borderWidth: 2,
                pointBackgroundColor: "rgba(153, 102, 255, 1)",
                tension: 0.3,
                fill: false,
            },
        ],
    };

    const seasonalOptions: ChartOptions<"bar"> = {
        responsive: true,
        animation: false,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: "Seasonal Audio System Usage",
                font: {
                    size: 16,
                    weight: "bold",
                },
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const season = context.label;
                        const data = seasonalData[season];

                        return [
                            `Average uses: ${(data.totalUses / data.customerCount).toFixed(2)}`,
                            `Total customers: ${data.customerCount}`,
                            `Total uses: ${data.totalUses}`,
                        ];
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Average Uses per Customer",
                    font: {
                        weight: "bold",
                    },
                },
                grid: {
                    color: "rgba(0, 0, 0, 0.1)",
                },
            },
            x: {
                title: {
                    display: true,
                    text: "Season (Year)",
                    font: {
                        weight: "bold",
                    },
                },
                grid: {
                    display: false,
                },
            },
        },
        onClick: (_, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;

                setSelectedSeason(Object.keys(seasonalData)[index]);
            }
        },
    };

    const seasonalLineOptions: ChartOptions<"line"> = {
        responsive: true,
        animation: false,
        plugins: {
            legend: { position: "top" },
            title: {
                display: true,
                text: "Seasonal Audio System Usage (Line Chart)",
                font: { size: 16, weight: "bold" },
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const season = context.label;
                        const data = seasonalData[season];

                        return [
                            `Average uses: ${(data.totalUses / data.customerCount).toFixed(2)}`,
                            `Total customers: ${data.customerCount}`,
                            `Total uses: ${data.totalUses}`,
                        ];
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Average Uses per Customer",
                    font: { weight: "bold" },
                },
            },
            x: {
                title: {
                    display: true,
                    text: "Season (Year)",
                    font: { weight: "bold" },
                },
            },
        },
    };

    const timeOfDayData = timeSeriesData.reduce((acc, curr) => {
        const date = new Date(curr.ride_date);
        const hour = date.getHours();
        const timeSlot = `${hour}:00`;

        if (!acc[timeSlot]) {
            acc[timeSlot] = 0;
        }

        acc[timeSlot] += curr.rides;

        return acc;
    }, {} as Record<string, number>);

    const timeOfDayChartData = {
        labels: Object.keys(timeOfDayData),
        datasets: [
            {
                label: "Usage by Time of Day",
                data: Object.values(timeOfDayData),
                backgroundColor: "rgba(255, 99, 132, 0.6)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1,
            },
        ],
    };

    const timeOfDayOptions: ChartOptions<"bar"> = {
        responsive: true,
        animation: false,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: "Time of Day Usage",
                font: {
                    size: 16,
                    weight: "bold",
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Number of Uses",
                    font: {
                        weight: "bold",
                    },
                },
                grid: {
                    color: "rgba(0, 0, 0, 0.1)",
                },
            },
            x: {
                title: {
                    display: true,
                    text: "Time of Day",
                    font: {
                        weight: "bold",
                    },
                },
                grid: {
                    display: false,
                },
            },
        },
    };

    return (
        <div className="audio-container">
            <Sidebar />
            <div className="main-content">
                <div className="chart-section">
                    <h1 className="text-3xl font-bold mb-6 text-center">Audio System Analysis</h1>

                    {/* Seasonal Usage (Bar) */}
                    <div className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Seasonal Usage</h2>
                        <div className="chart-card">
                            <Bar data={seasonalChartData} options={seasonalOptions} />
                        </div>
                    </div>

                    {/* Seasonal Usage (Line) */}
                    <div className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Seasonal Usage (Line Chart)</h2>
                        <div className="chart-card">
                            <Line data={seasonalChartData} options={seasonalLineOptions} />
                        </div>
                    </div>

                    {/* Time of Day Usage */}
                    <div className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Time of Day Usage</h2>
                        <div className="chart-card">
                            <Bar data={timeOfDayChartData} options={timeOfDayOptions} />
                        </div>
                    </div>

                    {selectedSeason && (
                        <div className="mb-10">
                            <h2 className="text-2xl font-semibold mb-4">Season {selectedSeason} Details</h2>
                            <div className="chart-card">
                                <p className="text-gray-600 mb-4">Selected season: {selectedSeason}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="data-summary mt-10 p-6 bg-white rounded-lg shadow">
                    <h2 className="text-2xl font-semibold mb-4">Summary</h2>
                    <p className="text-gray-600">
            This dashboard provides a comprehensive analysis of audio system usage patterns.
            The seasonal chart shows average usage per customer by year (both bar and line),
            while the time of day chart displays usage patterns throughout the day.
            Click on a season to view detailed information for that period.
                    </p>
                </div>
            </div>
        </div>
    );
}
