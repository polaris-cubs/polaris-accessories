"use client";

import React from "react";
import useSWR from "swr";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StateDataChartsProps {
    state: string;
}

export const StateDataCharts: React.FC<StateDataChartsProps> = ({ state }) => {
    const { data: vehicleData, error: vehicleError } = useSWR(
        state ? `http://localhost:8080/api/vehicle-summary?state=${encodeURIComponent(state)}` : null,
        fetcher
    );

    const { data: accessoryData, error: accessoryError } = useSWR(
        state ? `http://localhost:8080/api/accessory-summary?state=${encodeURIComponent(state)}` : null,
        fetcher
    );

    if (vehicleError || accessoryError) {
        return <div className="text-red-500">Error loading state data.</div>;
    }

    if (!state) {
        return <div className="text-red-500">Invalid state parameter</div>;
    }

    return (
        <div className="w-full max-w-2xl">
            <div className="p-4 bg-white shadow-md rounded-lg">
                <h2 className="text-xl font-semibold mb-4">🚗 Vehicle Usage Summary</h2>
                {vehicleData ? (
                    <ul className="list-disc pl-6 mb-4">
                        {vehicleData.map((v: any) => (
                            <li key={v.brand}>
                                {v.brand}: {v.rides} rides ({v.vehicles} unique vehicles)
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Loading vehicle data...</p>
                )}
                {vehicleData && (
                    <Bar
                        data={{
                            labels: vehicleData.map((v: any) => v.brand),
                            datasets: [
                                {
                                    label: "Total Rides",
                                    data: vehicleData.map((v: any) => v.rides),
                                    backgroundColor: "rgba(54, 162, 235, 0.6)",
                                },
                            ],
                        }}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top' as const,
                                },
                                title: {
                                    display: true,
                                    text: 'Vehicle Usage by Brand'
                                }
                            }
                        }}
                    />
                )}
            </div>

            <div className="mt-6 p-4 bg-white shadow-md rounded-lg">
                <h2 className="text-xl font-semibold mb-4">🔧 Most Used Accessories</h2>
                {accessoryData ? (
                    <ul className="list-disc pl-6 mb-4">
                        {accessoryData.map((a: any) => (
                            <li key={a.property_name}>
                                {a.property_name}: {a.usage_count} uses
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Loading accessory data...</p>
                )}
                {accessoryData && (
                    <Bar
                        data={{
                            labels: accessoryData.map((a: any) => a.property_name),
                            datasets: [
                                {
                                    label: "Usage Count",
                                    data: accessoryData.map((a: any) => a.usage_count),
                                    backgroundColor: "rgba(255, 99, 132, 0.6)",
                                },
                            ],
                        }}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top' as const,
                                },
                                title: {
                                    display: true,
                                    text: 'Accessory Usage Distribution'
                                }
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
}; 