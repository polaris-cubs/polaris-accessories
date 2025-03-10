"use client";

import React from "react";
import USMap from "@/components/USMap"; 
import Sidebar from "@/components/sidebar/sidebar";
import "@/app/dashboard/dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="main-content">
        <div className="map-section">
          <h1 className="text-3xl font-bold mb-6 text-center">US Map with State Boundaries</h1>
          <USMap />
        </div>
      </div>
    </div>
  );
}

