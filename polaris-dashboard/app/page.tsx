"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import USDrillDownMap from "@/components/USDrillDownMap";
import Sidebar from "@/components/sidebar/sidebar";
import "@/styles/dashboard.css";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [showPanel, setShowPanel] = useState<boolean>(false);
    const router = useRouter();

    const { data: usSummary, error: summaryError } = useSWR("http://localhost:8080/api/us-summary", fetcher);
    const { data: vehicleData } = useSWR(
        selectedState ? `http://localhost:8080/api/vehicle-summary?state=${encodeURIComponent(selectedState)}` : null,
        fetcher
    );
    const { data: accessoryData } = useSWR(
        selectedState ? `http://localhost:8080/api/accessory-summary?state=${encodeURIComponent(selectedState)}` : null,
        fetcher
    );

    if (summaryError) return <div>Error loading US summary data.</div>;
    if (!usSummary) return <div>Loading US summary data...</div>;

    return (
        <div className="dashboard-container flex h-screen">
            <Sidebar className="w-[20%] h-full" />

            <div className="main-content flex w-full">
                
                {/* 지도 섹션 (왼쪽) */}
                <div className="w-1/2 flex justify-center items-center transition-all duration-700">
                    <USDrillDownMap
                        usSummary={usSummary}
                        onStateSelect={(state) => {
                            setSelectedState(state);
                            setShowPanel(true);
                        }}
                    />
                </div>

                {/* 데이터 패널 (오른쪽) */}
                <div
                    className={`w-1/2 p-6 transition-all duration-700 flex flex-col ${
                        showPanel ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
                    }`}
                >
                    <button
                        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded self-start"
                        onClick={() => {
                            setShowPanel(false);
                            setTimeout(() => setSelectedState(null), 700);
                        }}
                    >
                        Back to US Map
                    </button>

                    <h2 className="text-2xl font-semibold mb-4">{selectedState} - Data Panel</h2>

                    <div className="mt-6 p-4 bg-white shadow-md rounded-lg w-full">
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

                    <div className="mt-6 p-4 bg-white shadow-md rounded-lg w-full">
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
                        className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        onClick={() => router.push(`/state/${selectedState}/details`)}
                    >
                        View Detailed Data for {selectedState}
                    </button>
                </div>
            </div>
        </div>
    );
}
