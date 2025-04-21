"use client";

import React from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

import DetailedCountyMap from "@/components/DetailedCountyMap";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StateDetailPage() {
    const { stateName } = useParams(); 

    const { data: vehicleData, error: vehicleError } = useSWR(
        `http://localhost:8080/api/vehicle-summary?state=${encodeURIComponent(stateName)}`,
        fetcher
    );

    const { data: accessoryData, error: accessoryError } = useSWR(
        `http://localhost:8080/api/accessory-summary?state=${encodeURIComponent(stateName)}`,
        fetcher
    );

    if (vehicleError || accessoryError) {
        return <div className="text-red-500">Error loading state data.</div>;
    }

    return (
        <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold mt-6">{stateName} - Detailed County Map</h1>

            <button
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                onClick={() => window.history.back()}
            >
                Back to US Map
            </button>

            <div className="mt-6">
                <DetailedCountyMap stateName={stateName} />
            </div>

            <div className="mt-6 p-4 bg-white shadow-md rounded-lg w-full max-w-2xl">
                <h2 className="text-xl font-semibold">🚗 Vehicle Data</h2>
                {vehicleData ? (
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
                ) : (
                    <p>Loading vehicle data...</p>
                )}
            </div>

            <div className="mt-6 p-4 bg-white shadow-md rounded-lg w-full max-w-2xl">
                <h2 className="text-xl font-semibold">🔧 Accessory Usage</h2>
                {accessoryData ? (
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
                ) : (
                    <p>Loading accessory data...</p>
                )}
            </div>
        </div>
    );
}
