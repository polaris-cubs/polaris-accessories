"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

import USDrillDownMap from "./USDrillDownMap";
import DetailedCountyMap from "./DetailedCountyMap";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Dashboard() {
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [showCharts, setShowCharts] = useState<boolean>(false);

    const { data: usSummary, error: summaryError } = useSWR("http://localhost:8080/api/us-summary", fetcher);

    const { data: stateDetail } = useSWR(
        selectedState ? `http://localhost:8080/api/state-detail?state=${encodeURIComponent(selectedState)}` : null,
        fetcher
    );
    const { data: vehicleData } = useSWR(
        selectedState ? `http://localhost:8080/api/vehicle-summary?state=${encodeURIComponent(selectedState)}` : null,
        fetcher
    );
    const { data: accessoryData } = useSWR(
        selectedState ? `http://localhost:8080/api/accessory-summary?state=${encodeURIComponent(selectedState)}` : null,
        fetcher
    );

    if (summaryError) return <div className="text-center text-red-500 mt-4">⚠️ Error loading US summary data.</div>;
    if (!usSummary) return <div className="text-center mt-4">⏳ Loading US summary data...</div>;

    return (
        <div className="flex transition-all duration-500">
            <div className={`transition-all duration-500 ${selectedState ? "w-1/2" : "w-full"} flex justify-center`}>
                <USDrillDownMap 
                    usSummary={usSummary} 
                    onStateSelect={(state) => { 
                        setSelectedState(state);
                        setShowCharts(false);
                    }} 
                />
            </div>

            {selectedState && (
                <div className="w-1/2 flex flex-col items-center p-6">
                    <h2 className="text-3xl font-bold mb-4">{selectedState} - Detailed County Map</h2>

                    <DetailedCountyMap stateName={selectedState} />

                    <div className="mt-6 p-4 bg-white shadow-md rounded-lg w-full max-w-2xl">
                        <h2 className="text-xl font-semibold">🚗 Vehicle Usage Summary</h2>
                        {vehicleData ? (
                            <ul>
                                {vehicleData.map((v: any) => (
                                    <li key={v.brand}>{v.brand}: {v.rides} rides, {v.vehicles} vehicles</li>
                                ))}
                            </ul>
                        ) : (
                            <p>Loading vehicle data...</p>
                        )}
                    </div>

                    <div className="mt-6 p-4 bg-white shadow-md rounded-lg w-full max-w-2xl">
                        <h2 className="text-xl font-semibold">🔧 Most Used Accessories</h2>
                        {accessoryData ? (
                            <ul>
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
                        {showCharts ? "Hide Detailed Data" : `View Detailed Data for ${selectedState}`}
                    </button>

                    {showCharts && vehicleData && (
                        <div className="mt-6 p-4 bg-white shadow-md rounded-lg w-full max-w-2xl">
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
                            />
                        </div>
                    )}

                    {showCharts && accessoryData && (
                        <div className="mt-6 p-4 bg-white shadow-md rounded-lg w-full max-w-2xl">
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
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
