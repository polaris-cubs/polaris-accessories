"use client";

import React, { useMemo } from "react";
import useSWR from "swr";
import { Card, CardHeader, CardBody, Divider } from "@heroui/react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

import { filterNonAccessories } from "@/lib/utils";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StatePage() {
    const { data: accessoryData } = useSWR(
        "http://localhost:8080/api/accessory-summary",
        fetcher
    );

    // 액세서리 데이터 필터링 - API 응답이 있을 때만 실행
    const filteredAccessories = useMemo(() => 
        accessoryData ? filterNonAccessories(accessoryData) : [], 
    [accessoryData]
    );

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-xl font-semibold">🔧 Top Accessories</p>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody>
                    {accessoryData ? (
                        <Bar
                            data={{
                                labels: filteredAccessories
                                    .sort((a: any, b: any) => b.usage_count - a.usage_count)
                                    .slice(0, 5)
                                    .map((a: any) => a.property_name),
                                datasets: [
                                    {
                                        label: "Usage Count",
                                        data: filteredAccessories
                                            .sort((a: any, b: any) => b.usage_count - a.usage_count)
                                            .slice(0, 5)
                                            .map((a: any) => a.usage_count),
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
    );
} 