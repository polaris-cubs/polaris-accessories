"use client";

import React, { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ChartOptions } from "chart.js";

import Sidebar from "@/components/sidebar/sidebar";
import "@/app/my-data/subpages/spreader/spreader.css";

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement, PointElement,
    Title, Tooltip, Legend
);

// Types for API responses
type TimeSeriesData = {
    ride_date: string;
    rides: number;
};

type VehicleSummary = {
    brand: string;
    rides: number;
    vehicles: number;
};

export default function Spreader() {
    const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
    const [vehicleData, setVehicleData] = useState<VehicleSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch time series and vehicle data
                const [timeSeriesRes, vehicleRes] = await Promise.all([
                    fetch('http://localhost:8080/api/time-series'),
                    fetch('http://localhost:8080/api/vehicle-summary')
                ]);

                if (!timeSeriesRes.ok || !vehicleRes.ok) {
                    throw new Error('Failed to fetch data');
                }

                const [timeSeriesJson, vehicleJson] = await Promise.all([
                    timeSeriesRes.json(),
                    vehicleRes.json()
                ]);

                setTimeSeriesData(timeSeriesJson);
                setVehicleData(vehicleJson);
                setLoading(false);
            } catch (err) {
                console.error('Error in fetchData:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="spreader-container">
                <Sidebar />
                <div className="main-content">
                    <div className="loading">Loading data...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="spreader-container">
                <Sidebar />
                <div className="main-content">
                    <div className="error">Error: {error}</div>
                </div>
            </div>
        );
    }

    // Process data for charts
    const timeSeriesChartData = {
        labels: timeSeriesData.map(d => d.ride_date),
        datasets: [
            {
                label: "Daily Usage",
                data: timeSeriesData.map(d => d.rides),
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
            },
        ],
    };

    const vehicleUsageData = {
        labels: vehicleData.map(d => d.brand),
        datasets: [
            {
                label: "Rides per Vehicle",
                data: vehicleData.map(d => d.rides / d.vehicles),
                backgroundColor: "rgba(255, 99, 132, 0.6)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1,
            },
        ],
    };

    const barOptions: ChartOptions<"bar"> = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `Usage count: ${context.raw}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Number of Uses",
                },
            },
            x: {
                title: {
                    display: true,
                    text: "State",
                },
            },
        },
    };

    const lineOptions: ChartOptions<"line"> = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Number of Uses",
                },
            },
            x: {
                title: {
                    display: true,
                    text: "Date",
                },
            },
        },
    };

    return (
        <div className="spreader-container">
            <Sidebar />

            <div className="main-content">
                <div className="chart-section">
                    <h1 className="text-3xl font-bold mb-6 text-center">Spreader Analysis</h1>
                    
                    {/* Time Series Usage */}
                    <div className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Daily Usage Trend</h2>
                        <Line data={timeSeriesChartData} options={lineOptions} />
                    </div>

                    {/* Vehicle Usage */}
                    <div className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">Vehicle Usage Efficiency</h2>
                        <Bar data={vehicleUsageData} options={barOptions} />
                    </div>
                </div>

                <div className="data-summary mt-10 p-6 bg-white rounded-lg shadow">
                    <h2 className="text-2xl font-semibold mb-4">Summary</h2>
                    <p className="text-gray-600">
                        This dashboard provides a comprehensive analysis of spreader usage patterns.
                        The data shows daily usage trends and vehicle-specific usage patterns.
                        All data is fetched in real-time from the backend API.
                    </p>
                </div>
            </div>
        </div>
    );
} 