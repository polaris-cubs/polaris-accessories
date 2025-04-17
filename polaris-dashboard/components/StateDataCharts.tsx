"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StateDataChartsProps {
    state?: string;
}

export const StateDataCharts: React.FC<StateDataChartsProps> = ({ state }) => {
    const [showCharts, setShowCharts] = useState<boolean>(false);

    const { data: vehicleData } = useSWR(
        state ? `http://localhost:8080/api/vehicle-summary?state=${encodeURIComponent(state)}` : null,
        fetcher
    );
    const { data: accessoryData } = useSWR(
        state ? `http://localhost:8080/api/accessory-summary?state=${encodeURIComponent(state)}` : null,
        fetcher
    );

    return (
        <div className="w-full">
            <div className="mt-6 p-4 bg-white shadow-md rounded-lg w-full">
                <h2 className="text-xl font-semibold">🚗 Vehicle Usage Summary</h2>
                {vehicleData ? (
                    <ul className="list-disc pl-6">
                        {vehicleData.map((v: any) => (
                            <li key={v.brand}>{v.brand}: {v.rides} rides, {v.vehicles} vehicles</li>
                        ))}
                    </ul>
                ) : (
                    <p>Loading vehicle data...</p>
                )}
            </div>

            <div className="mt-6 p-4 bg-white shadow-md rounded-lg w-full">
                <h2 className="text-xl font-semibold">🔧 Most Used Accessories</h2>
                {accessoryData ? (
                    <ul className="list-disc pl-6">
                        {accessoryData.map((a: any) => (
                            <li key={a.property_name}>{a.property_name}: {a.usage_count} uses</li>
                        ))}
                    </ul>
                ) : (
                    <p>Loading accessory data...</p>
                )}
            </div>

            <button
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                onClick={() => setShowCharts(!showCharts)}
            >
                {showCharts ? "Hide Detailed Data" : `View Detailed Data for ${state}`}
            </button>

            {showCharts && vehicleData && (
                <div className="mt-6 p-4 bg-white shadow-md rounded-lg w-full">
                    <h2 className="text-xl font-semibold">📊 Vehicle Data</h2>
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
                </div>
            )}

            {showCharts && accessoryData && (
                <div className="mt-6 p-4 bg-white shadow-md rounded-lg w-full">
                    <h2 className="text-xl font-semibold">📊 Accessory Usage</h2>
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
                </div>
            )}
        </div>
    );
}; 