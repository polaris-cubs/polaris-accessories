"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions } from "chart.js";
import Sidebar from "@/components/sidebar/sidebar";
import "@/app/my-data/my-data.css"; 

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

export default function MyData() {
  return (
    <div className="my-data-container">
      <Sidebar />

      <div className="main-content">
        <div className="chart-section">
          <h1 className="text-3xl font-bold mb-6 text-center">Vehicle State Distribution</h1>
          <Bar data={stateData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}
