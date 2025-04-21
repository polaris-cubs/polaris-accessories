"use client";

// Import React and chart dependencies
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions } from "chart.js";

import Sidebar from "@/components/sidebar/sidebar";
import "@/app/my-data/my-data.css";

// Register necessary chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Configure chart options
const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
        legend: {
            position: "top",
        },
        title: {
            display: true,
            text: "Total Accessory Usage Across All States",
        },
    },
};

export default function MyData() {
    // State for dynamically fetched chart data
    const [chartData, setChartData] = useState<any>(null);

    useEffect(() => {
        // Fetch and process accessory usage data
        const fetchData = async () => {
            try {
                const res = await fetch("http://localhost:8080/api/accessory-summary");
                const data = await res.json();

                // Aggregate usage counts by property_name
                const usageMap: Record<string, number> = {};

                data.forEach((item: any) => {
                    const key = item.property_name;

                    if (usageMap[key]) {
                        usageMap[key] += item.usage_count;
                    } else {
                        usageMap[key] = item.usage_count;
                    }
                });

                const labels = Object.keys(usageMap);
                const values = Object.values(usageMap);

                // Update chart data
                setChartData({
                    labels,
                    datasets: [
                        {
                            label: "Usage Count",
                            data: values,
                            backgroundColor: "rgba(75, 192, 192, 0.6)",
                        },
                    ],
                });
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="my-data-container">
            <Sidebar />

            <div className="main-content">
                <div className="chart-section">
                    <h1 className="text-3xl font-bold mb-6 text-center">Vehicle Accessory Usage</h1>
                    {chartData ? <Bar data={chartData} options={barOptions} /> : <p>Loading...</p>}
                </div>
            </div>
        </div>
    );
}
