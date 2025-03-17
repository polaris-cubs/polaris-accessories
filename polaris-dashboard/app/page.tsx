"use client";

import React, { useState } from "react";
import useSWR from "swr";
import USDrillDownMap from "@/components/USDrillDownMap";
import DetailedCountyMap from "@/components/DetailedCountyMap";
import Sidebar from "@/components/sidebar/sidebar";
import "@/styles/dashboard.css";

// Simple fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
    const [selectedState, setSelectedState] = useState<string | null>(null);

    // Fetch aggregated US summary data
    const { data: usSummary, error: summaryError } = useSWR("http://localhost:8080/api/us-summary", fetcher);

    // Fetch state-level details when a state is selected
    const { data: stateDetail, error: stateError } = useSWR(
        selectedState ? `http://localhost:8080/api/state-detail?state=${encodeURIComponent(selectedState)}` : null,
        fetcher
    );

    if (summaryError) return <div>Error loading US summary data.</div>;
    if (!usSummary) return <div>Loading US summary data...</div>;

    return (
        <div className="dashboard-container">
            <Sidebar />

            <div className="main-content">
                <h1 className="text-3xl font-bold text-center mb-6">Connected Vehicle Data Dashboard</h1>

                {!selectedState ? (
                    // Show US Map with drill-down functionality
                    <USDrillDownMap
                        usSummary={usSummary}
                        onStateSelect={(state) => setSelectedState(state)}
                    />
                ) : (
                    // Show Detailed County Map when a state is selected
                    <div className="flex flex-col items-center">
                        <button className="mb-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setSelectedState(null)}>
                            Back to US Map
                        </button>
                        <h2 className="text-2xl font-semibold mb-4">{selectedState} - Detailed County Map</h2>
                        <DetailedCountyMap stateDetail={stateDetail} stateName={selectedState} />
                        {stateError && <div>Error loading state details.</div>}
                    </div>
                )}
            </div>
        </div>
    );
}
