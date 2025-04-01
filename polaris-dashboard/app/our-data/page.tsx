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
  // const timeLabels = ["10:00", "10:05", "10:10", "10:15", "10:20"];
  // const snowPlowValues = [1, 0, 1, 0, 1]; // 1 = Up, 0 = Down
  // const speedValues = [30, 35, 40, 45, 50]; 
  const categories = ["2000-2001", "2001-2002", "2002-2003", "2003-2004", "2004-2005", "2005-2006", "2006-2007", "2007-2008", "2008-2009", "2009-2010", "2010-2011", "2011-2012", "2012-2013", "2013-2014", "2014-2015", "2015-2016", "2016-2017", "2017-2018", "2018-2019", "2019-2020", "2020-2021", "2021-2022", "2022-2023", "2023-2024"]
  const values = [6.5, 8.8, 9.8, 9.1, 8.1, 7.1, 8.3, 9.1, 10.8, 8.7, 8.9, 6.7, 5.6, 4.4, 4.6, 6.7, 7.0, 6.7, 6.7, 8.5, 7.9, 8.7, 8.4, 7.3]


  const chartData = {
    labels: categories,
    datasets: [
      {
        type: "bar",
        label: "Average Uses of Snowplow Accessory per Customer",
        data: values,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        yAxisID: "y1",
        xAxisID: "x",
        order: 2,
      }//,
      // {
      //   type: "line",
      //   label: "Speed (km/h)",
      //   data: speedValues,
      //   borderColor: "rgba(255, 99, 132, 1)",
      //   backgroundColor: "rgba(255, 99, 132, 0.2)",
      //   borderWidth: 2,
      //   yAxisID: "y2",
      //   order: 1,
      // },
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
          text: "Average Uses of Snowplow Accessory per Customer",
        },
        ticks: {
          stepSize: 1,
        },
      },
      x: {
        title: {
          display: true,
          text: "Season",
        },
        // grid: {
        //   drawOnChartArea: false,
        // },
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
