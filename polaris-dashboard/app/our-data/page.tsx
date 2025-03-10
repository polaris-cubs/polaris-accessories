"use client";

import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, Title, Tooltip, Legend, PointElement } from "chart.js";
import Sidebar from "@/components/sidebar/sidebar";
import "@/app/our-data/our-data.css";
import { useState } from "react";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function OurData() {
  const [showTooltip, setShowTooltip] = useState(false);

  //Hardcoded Data 
  const timeLabels = ["10:00", "10:05", "10:10", "10:15", "10:20"];
  const snowPlowValues = [1, 0, 1, 0, 1]; // 1 = Up, 0 = Down
  const speedValues = [30, 35, 40, 45, 50]; 

  const chartData = {
    labels: timeLabels,
    datasets: [
      {
        type: "bar",
        label: "Snow Plow (Up/Down)",
        data: snowPlowValues,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        yAxisID: "y1",
        order: 2,
      },
      {
        type: "line",
        label: "Speed (km/h)",
        data: speedValues,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderWidth: 2,
        yAxisID: "y2",
        order: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y1: {
        type: "linear",
        position: "left",
        title: {
          display: true,
          text: "Snow Plow (Up/Down)",
        },
        ticks: {
          stepSize: 1,
        },
      },
      y2: {
        type: "linear",
        position: "right",
        title: {
          display: true,
          text: "Speed (km/h)",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="our-data-container">
      <Sidebar />
      <div className="main-content">
        <div className="chart-box">
          <h1 className="chart-title">Accessory</h1>
          <div className="chart-area">
            <Bar data={chartData} options={chartOptions} />
          </div>

          <div
            className="info-box"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {showTooltip && <div className="tooltip">Compares the operation status of the Snow Plow and the changes in vehicle speed over time simultaneously.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
