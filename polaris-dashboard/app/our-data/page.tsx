"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions } from "chart.js";
import Sidebar from "@/components/sidebar/sidebar";
import "@/app/our-data/our-data.css"; 

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const fetcher = (url: string) => fetch(`http://localhost:8080${url}`).then((res) => res.json());

export default function OurData() {
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

    const { data: usSummary } = useSWR("/api/us-summary", fetcher);
    const { data: rides } = useSWR(
        selectedState || selectedVehicle || selectedCustomer || selectedBrand
            ? `/api/rides?${selectedState ? `state=${selectedState}&` : ""}${selectedVehicle ? `vehicle_id=${selectedVehicle}&` : ""}${selectedCustomer ? `customer_id=${selectedCustomer}&` : ""}${selectedBrand ? `vehicle=${selectedBrand}` : ""}`
            : "/api/rides",
        fetcher
    );

    const { data: vehicleData } = useSWR(
        selectedState || selectedVehicle || selectedCustomer || selectedBrand
            ? `/api/vehicle-summary?${selectedState ? `state=${selectedState}&` : ""}${selectedVehicle ? `vehicle_id=${selectedVehicle}&` : ""}${selectedCustomer ? `customer_id=${selectedCustomer}&` : ""}${selectedBrand ? `vehicle=${selectedBrand}` : ""}`
            : "/api/vehicle-summary",
        fetcher
    );

    // 📊 차트 옵션
    const barOptions: ChartOptions<"bar"> = {
        responsive: true,
        plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Vehicle Usage Summary" },
        },
    };

    // 📊 차트 데이터 생성
    const chartData = {
        labels: vehicleData?.map((v: any) => v.brand) || [],
        datasets: [
            {
                label: "Total Rides",
                data: vehicleData?.map((v: any) => v.rides) || [],
                backgroundColor: "rgba(54, 162, 235, 0.6)",
            },
        ],
    };

    return (
        <div className="our-data-container flex">
            <Sidebar />

            <div className="main-content p-6 flex-grow">
                <h1 className="text-3xl font-bold mb-6 text-center">Our Data Dashboard</h1>

                <div className="flex gap-4 mb-6">
                    <select onChange={(e) => setSelectedState(e.target.value)} className="p-2 border rounded">
                        <option value="">Select State</option>
                        {usSummary?.map((state: any) => (
                            <option key={state.state} value={state.state}>{state.state}</option>
                        ))}
                    </select>

                    <select onChange={(e) => setSelectedVehicle(e.target.value)} className="p-2 border rounded">
                        <option value="">Select Vehicle</option>
                        {[...new Set(rides?.map((ride: any) => ride.vehicle_id))]?.map((vehicle) => (
                            <option key={vehicle} value={vehicle}>{vehicle}</option>
                        ))}
                    </select>

                    <select onChange={(e) => setSelectedCustomer(e.target.value)} className="p-2 border rounded">
                        <option value="">Select Customer</option>
                        {[...new Set(rides?.map((ride: any) => ride.customer_id))]?.map((customer) => (
                            <option key={customer} value={customer}>{customer}</option>
                        ))}
                    </select>

                    <select onChange={(e) => setSelectedBrand(e.target.value)} className="p-2 border rounded">
                        <option value="">Select Brand</option>
                        {[...new Set(vehicleData?.map((v: any) => v.brand))]?.map((brand) => (
                            <option key={brand} value={brand}>{brand}</option>
                        ))}
                    </select>
                </div>

                {/* 📋 차량 테이블 */}
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">Ride ID</th>
                            <th className="border p-2">State</th>
                            <th className="border p-2">Vehicle ID</th>
                            <th className="border p-2">Brand</th>
                            <th className="border p-2">Customer ID</th>
                            <th className="border p-2">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rides?.map((ride: any) => (
                            <tr key={ride.ride_id} className="text-center border-t">
                                <td className="border p-2">{ride.ride_id}</td>
                                <td className="border p-2">{ride.state}</td>
                                <td className="border p-2">{ride.vehicle_id}</td>
                                <td className="border p-2">{ride.brand}</td>
                                <td className="border p-2">{ride.customer_id}</td>
                                <td className="border p-2">{new Date(ride.event_timestamp).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {selectedState && selectedVehicle && selectedCustomer && selectedBrand && (
                    <div className="mt-8 p-4 bg-white shadow-md rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">📊 Vehicle Usage Summary</h2>
                        {vehicleData?.length ? (
                            <Bar data={chartData} options={barOptions} />
                        ) : (
                            <p>No Data Available</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
