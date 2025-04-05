"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions } from "chart.js";

import Sidebar from "@/components/sidebar/sidebar";
import "@/app/my-data/subpages/snowplow/snowplow.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const snowplowData = {
    labels: ["Category 1", "Category 2", "Category 3", "Category 4", "Category 5"],
    datasets: [
        {
            label: "Snowplow Distribution",
            data: [1200, 800, 600, 400, 200],
            backgroundColor: [
                "rgba(255, 99, 132, 0.6)",
                "rgba(54, 162, 235, 0.6)",
                "rgba(255, 206, 86, 0.6)",
                "rgba(75, 192, 192, 0.6)",
                "rgba(153, 102, 255, 0.6)",
            ],
        },
    ],
};

const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
        legend: {
            position: "top",
        },
        title: {
            display: true,
            text: "Snowplow Distribution",
        },
    },
};

export default function Snowplow() {
    return (
        <div className="snowplow-container">
            <Sidebar />

            <div className="main-content">
                <div className="chart-section">
                    <h1 className="text-3xl font-bold mb-6 text-center">Snowplow Analysis</h1>
                    <Bar data={snowplowData} options={barOptions} />
                </div>

                <div className="data-summary mt-10 p-6 bg-white rounded-lg shadow">
                    <h2 className="text-2xl font-semibold mb-4">Summary</h2>
                    <p className="text-gray-600">
            This page displays the distribution and analysis of Snowplow data across different categories.
            The bar chart above shows the relative proportions of each category in the dataset.
                    </p>
                </div>
            </div>
        </div>
    );
} 