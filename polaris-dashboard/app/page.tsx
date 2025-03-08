"use client";

import React from "react";
import USMap from "@/components/USMap";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const stateData = {
  labels: ["Drive", "RUN", "None", "2WD", "4WD"],
  datasets: [
    {
      label: "Vehicle States Count",
      data: [1000, 1000, 1000, 523, 477],
      backgroundColor: [
        "rgba(75, 192, 192, 0.6)",
        "rgba(255, 99, 132, 0.6)",
        "rgba(54, 162, 235, 0.6)",
        "rgba(255, 206, 86, 0.6)",
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
      text: "Vehicle State Distribution",
    },
  },
};

export default function Dashboard() {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Content Section */}
        <main className="flex-1 p-10">
          {/* US Map Section */}
          <div className="bg-white p-6 shadow-md rounded-lg">
            <h1 className="text-3xl font-bold mb-6 text-center">US Map with State Boundaries</h1>
            <USMap />
          </div>

          {/* Chart Section */}
          <div className="mt-10 bg-white shadow-md p-5 rounded-lg">
            <Bar data={stateData} options={barOptions} />
          </div>
        </main>
      </div>
    </div>
  );
}