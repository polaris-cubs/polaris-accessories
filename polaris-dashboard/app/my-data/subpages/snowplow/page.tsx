"use client";

import React from "react";
import { Bar, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
} from "chart.js";

import Sidebar from "@/components/sidebar/sidebar";
import "@/app/my-data/subpages/snowplow/snowplow.css";

// Register required chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

// Bar chart data for snowplow distribution
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

// Line chart data for usage by time of day
const snowplowTimeData = {
    labels: ["12 AM", "3 AM", "6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"],
    datasets: [
        {
            label: "Snowplow Usage by Time of Day",
            data: [100, 200, 450, 800, 1200, 1000, 700, 300],
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "rgba(54, 162, 235, 1)",
        },
    ],
};

// Bar chart options
const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    animation: false,
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

// Line chart options
const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    animation: false,
    plugins: {
        legend: {
            position: "top",
        },
        title: {
            display: true,
            text: "Most Common Daytime of Use",
        },
    },
    scales: {
        y: {
            beginAtZero: true,
            title: {
                display: true,
                text: "Number of Uses"
            }
        },
        x: {
            title: {
                display: true,
                text: "Time of Day"
            }
        }
    }
};

export default function Snowplow() {
    return (
        <div className="snowplow-container">
            <Sidebar />

            <div className="main-content">
                <div className="chart-section">
                    <h1 className="text-3xl font-bold mb-6 text-center">Snowplow Analysis</h1>

                    {/* Bar Chart */}
                    <div className="chart-card">
                        <Bar data={snowplowData} options={barOptions} />
                    </div>

                    {/* Line Chart */}
                    <div className="chart-card">
                        <Line data={snowplowTimeData} options={lineOptions} />
                    </div>
                </div>

                <div className="data-summary mt-10 p-6 bg-white rounded-lg shadow">
                    <h2 className="text-2xl font-semibold mb-4">Summary</h2>
                    <p className="text-gray-600">
                        This page displays the distribution and analysis of Snowplow data across different categories.
                        The bar chart above shows the relative proportions of each category in the dataset.
                        The line chart visualizes the most common time of day snowplows are used.
                    </p>
                </div>
            </div>
        </div>
    );
}
