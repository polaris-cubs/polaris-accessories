"use client";

import React from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Card, CardBody, CardHeader, Divider } from "@heroui/react";

import DetailedCountyMap from "@/components/DetailedCountyMap";
import { filterNonAccessories } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StateDetailsPage() {
    const { stateName } = useParams() as { stateName: string };

    const { data: vehicleData } = useSWR(
        `http://localhost:8080/api/vehicle-summary?state=${encodeURIComponent(stateName)}`,
        fetcher
    );
    const { data: accessoryData } = useSWR(
        `http://localhost:8080/api/accessory-summary?state=${encodeURIComponent(stateName)}`,
        fetcher
    );

    // 액세서리 데이터 필터링 - API 응답이 있을 때만 실행
    const filteredAccessories = accessoryData ? filterNonAccessories(accessoryData) : [];

    return (
        <div className="flex flex-col items-center p-6 gap-6">
            <Card className="w-full max-w-4xl">
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-2xl font-bold">{stateName} - Detailed County Map</p>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody>
                    <DetailedCountyMap stateName={stateName} />
                </CardBody>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                <Card>
                    <CardHeader className="flex gap-3">
                        <div className="flex flex-col">
                            <p className="text-xl font-semibold">🚗 Vehicle Data</p>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        {vehicleData ? (
                            <Bar
                                data={{
                                    labels: vehicleData.map((v: any) => v.brand),
                                    datasets: [
                                        {
                                            label: "Total Rides",
                                            data: vehicleData.map((v: any) => v.rides),
                                            backgroundColor: "rgba(54, 162, 235, 0.6)",
                                        },
                                    ],
                                }}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                        },
                                    },
                                }}
                            />
                        ) : (
                            <p>Loading vehicle data...</p>
                        )}
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader className="flex gap-3">
                        <div className="flex flex-col">
                            <p className="text-xl font-semibold">🔧 Accessory Usage</p>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        {accessoryData ? (
                            <Bar
                                data={{
                                    labels: filteredAccessories.map((a: any) => a.property_name),
                                    datasets: [
                                        {
                                            label: "Usage Count",
                                            data: filteredAccessories.map((a: any) => a.usage_count),
                                            backgroundColor: "rgba(255, 99, 132, 0.6)",
                                        },
                                    ],
                                }}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                        },
                                    },
                                }}
                            />
                        ) : (
                            <p>Loading accessory data...</p>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
