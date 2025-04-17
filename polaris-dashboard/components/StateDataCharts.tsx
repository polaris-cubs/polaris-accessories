"use client";

import React from "react";
import useSWR from "swr";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface StateDataChartsProps {
    state: string;
    vehicleData?: any;
    accessoryData?: any;
    isLoading?: boolean;
}

export default function StateDataCharts({ state, vehicleData, accessoryData, isLoading }: StateDataChartsProps) {
    const { data: vehicleDataFromServer, error: vehicleError } = useSWR(
        state ? `http://localhost:8080/api/vehicle-summary?state=${encodeURIComponent(state)}` : null,
        fetcher
    );

    const { data: accessoryDataFromServer, error: accessoryError } = useSWR(
        state ? `http://localhost:8080/api/accessory-summary?state=${encodeURIComponent(state)}` : null,
        fetcher
    );

    if (vehicleError || accessoryError) {
        return <div className="text-red-500">Error loading state data.</div>;
    }

    if (!state) {
        return <div className="text-red-500">Invalid state parameter</div>;
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    padding: 12,
                    font: {
                        size: 11
                    },
                    boxWidth: 12,
                    boxHeight: 12
                }
            },
            title: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                },
                ticks: {
                    font: {
                        size: 11
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 11
                    }
                }
            }
        },
        layout: {
            padding: {
                top: 0,
                right: 8,
                bottom: 0,
                left: 8
            }
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-md p-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Vehicle Usage Analysis</h2>
                {isLoading ? (
                    <div className="flex items-center justify-center h-[180px]">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            <p className="text-sm text-gray-600">Loading vehicle data...</p>
                        </div>
                    </div>
                ) : !vehicleData ? (
                    <div className="flex items-center justify-center h-[180px]">
                        <p className="text-sm text-gray-600">No vehicle data available</p>
                    </div>
                ) : (
                    <div className="h-[180px]">
                        <Bar
                            data={{
                                labels: vehicleData.map((v: any) => v.brand),
                                datasets: [
                                    {
                                        label: "Total Rides",
                                        data: vehicleData.map((v: any) => v.rides),
                                        backgroundColor: "rgba(59, 130, 246, 0.6)",
                                        borderColor: "rgb(59, 130, 246)",
                                        borderWidth: 1,
                                    },
                                    {
                                        label: "Unique Vehicles",
                                        data: vehicleData.map((v: any) => v.vehicles),
                                        backgroundColor: "rgba(99, 102, 241, 0.6)",
                                        borderColor: "rgb(99, 102, 241)",
                                        borderWidth: 1,
                                    }
                                ],
                            }}
                            options={chartOptions}
                        />
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Accessory Usage Trends</h2>
                {isLoading ? (
                    <div className="flex items-center justify-center h-[180px]">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            <p className="text-sm text-gray-600">Loading accessory data...</p>
                        </div>
                    </div>
                ) : !accessoryData ? (
                    <div className="flex items-center justify-center h-[180px]">
                        <p className="text-sm text-gray-600">No accessory data available</p>
                    </div>
                ) : (
                    <div className="h-[180px]">
                        <Bar
                            data={{
                                labels: accessoryData.map((a: any) => a.property_name),
                                datasets: [
                                    {
                                        label: "Usage Count",
                                        data: accessoryData.map((a: any) => a.usage_count),
                                        backgroundColor: "rgba(244, 63, 94, 0.6)",
                                        borderColor: "rgb(244, 63, 94)",
                                        borderWidth: 1,
                                    }
                                ],
                            }}
                            options={chartOptions}
                        />
                    </div>
                )}
            </div>
        </div>
    );
} 