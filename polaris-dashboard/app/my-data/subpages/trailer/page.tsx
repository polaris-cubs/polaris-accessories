"use client";

import React, { useEffect, useState } from "react";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
} from "chart.js";
import { Card, CardBody, CardHeader } from "@heroui/react";

import Sidebar from "@/components/sidebar/sidebar";

// Register required chart.js components
ChartJS.register(
    CategoryScale, 
    LinearScale, 
    BarElement, 
    LineElement, 
    PointElement, 
    ArcElement, 
    Title, 
    Tooltip, 
    Legend
);

// Types for API responses
type TrailerUsage = {
    month: string;
    distance: number;
    frequency: number;
    load_weight: number;
};

type TrailerPurpose = {
    purpose: string;
    usage_count: number;
};

// Sample data for trailer types
const trailerTypeData = {
    labels: ["Utility", "Boat", "ATV/UTV", "Cargo", "Livestock", "Other"],
    datasets: [
        {
            label: "Trailer Type Distribution",
            data: [35, 25, 20, 10, 5, 5],
            backgroundColor: [
                "rgba(255, 99, 132, 0.6)",
                "rgba(54, 162, 235, 0.6)",
                "rgba(255, 206, 86, 0.6)",
                "rgba(75, 192, 192, 0.6)",
                "rgba(153, 102, 255, 0.6)",
                "rgba(255, 159, 64, 0.6)",
            ],
            borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(153, 102, 255, 1)",
                "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
        },
    ],
};

// Sample data for trailer usage by season
const trailerSeasonData = {
    labels: ["Winter", "Spring", "Summer", "Fall"],
    datasets: [
        {
            label: "Trailer Usage by Season",
            data: [15, 30, 40, 25],
            backgroundColor: [
                "rgba(54, 162, 235, 0.6)",
                "rgba(75, 192, 192, 0.6)",
                "rgba(255, 99, 132, 0.6)",
                "rgba(255, 206, 86, 0.6)",
            ],
            borderColor: [
                "rgba(54, 162, 235, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(255, 99, 132, 1)",
                "rgba(255, 206, 86, 1)",
            ],
            borderWidth: 1,
        },
    ],
};

// Sample data for distance traveled with trailer
const monthlyDistanceData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
        {
            label: "Average Distance with Trailer (miles)",
            data: [20, 25, 30, 40, 50, 65, 70, 65, 55, 45, 35, 25],
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            tension: 0.4,
            fill: true,
        },
    ],
};

export default function TrailerDashboard() {
    const [trailerUsageData, setTrailerUsageData] = useState<TrailerUsage[]>([]);
    const [trailerPurposeData, setTrailerPurposeData] = useState<TrailerPurpose[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // In a real implementation, these would be actual API calls
                // For now, we're just simulating the loading delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Mock data (would be replaced with actual API responses)
                const mockTrailerUsage: TrailerUsage[] = [
                    { month: "Jan", distance: 120, frequency: 5, load_weight: 500 },
                    { month: "Feb", distance: 150, frequency: 6, load_weight: 550 },
                    { month: "Mar", distance: 200, frequency: 8, load_weight: 600 },
                    { month: "Apr", distance: 250, frequency: 10, load_weight: 650 },
                    { month: "May", distance: 300, frequency: 12, load_weight: 700 },
                    { month: "Jun", distance: 350, frequency: 14, load_weight: 750 },
                ];
                
                const mockPurposeData: TrailerPurpose[] = [
                    { purpose: "Recreation", usage_count: 45 },
                    { purpose: "Moving", usage_count: 25 },
                    { purpose: "Work", usage_count: 20 },
                    { purpose: "Other", usage_count: 10 },
                ];
                
                setTrailerUsageData(mockTrailerUsage);
                setTrailerPurposeData(mockPurposeData);
                setLoading(false);
            } catch (err) {
                console.error("Error in fetchData:", err);
                setError(err instanceof Error ? err.message : "An error occurred");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6 ml-64">
                    <div className="p-4 text-center">Loading data...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6 ml-64">
                    <div className="p-4 text-center text-red-500">Error: {error}</div>
                </div>
            </div>
        );
    }

    // Prepare usage frequency data from the fetched data
    const usageFrequencyData = {
        labels: trailerUsageData.map(d => d.month),
        datasets: [
            {
                label: "Trailer Usage Frequency",
                data: trailerUsageData.map(d => d.frequency),
                backgroundColor: "rgba(153, 102, 255, 0.6)",
                borderColor: "rgba(153, 102, 255, 1)",
                borderWidth: 1,
            },
        ],
    };

    // Chart options
    const barOptions: ChartOptions<"bar"> = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    const pieOptions: ChartOptions<"pie"> = {
        responsive: true,
        plugins: {
            legend: {
                position: "right",
            },
        },
    };
    
    const doughnutOptions: ChartOptions<"doughnut"> = {
        responsive: true,
        plugins: {
            legend: {
                position: "right",
            },
        },
    };

    const lineOptions: ChartOptions<"line"> = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Distance (miles)",
                },
            },
        },
    };

    return (
        <div className="flex">
            <Sidebar />

            <div className="flex-1 p-6 ml-64">
                <h1 className="text-3xl font-bold mb-6">Trailer Usage Analysis</h1>

                <div className="flex flex-col space-y-6 mb-6">
                    {/* Trailer Type Distribution */}
                    <Card className="w-full">
                        <CardBody className="flex flex-row items-center">
                            <div className="w-2/3">
                                <h2 className="text-xl font-bold mb-4">Trailer Type Distribution</h2>
                                <Doughnut data={trailerTypeData} options={doughnutOptions} />
                            </div>
                            <div className="w-1/3 pl-8">
                                <h3 className="text-lg font-semibold mb-4">Trailer Insights</h3>
                                <ul className="space-y-3">
                                    <li>• Most common trailer type: <span className="font-semibold">Utility (35%)</span></li>
                                    <li>• Recreational trailers (Boat + ATV/UTV): <span className="font-semibold">45%</span> of all usage</li>
                                    <li>• Commercial trailers account for only <span className="font-semibold">15%</span> of total usage</li>
                                </ul>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Trailer Usage by Season */}
                    <Card className="w-full">
                        <CardBody className="flex flex-row items-center">
                            <div className="w-2/3">
                                <h2 className="text-xl font-bold mb-4">Trailer Usage by Season</h2>
                                <Pie data={trailerSeasonData} options={pieOptions} />
                            </div>
                            <div className="w-1/3 pl-8">
                                <h3 className="text-lg font-semibold mb-4">Seasonal Patterns</h3>
                                <ul className="space-y-3">
                                    <li>• Peak usage: <span className="font-semibold">Summer (40%)</span></li>
                                    <li>• Lowest usage: <span className="font-semibold">Winter (15%)</span></li>
                                    <li>• Spring and Fall combined: <span className="font-semibold">55%</span> of annual usage</li>
                                </ul>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Monthly Distance Chart */}
                    <Card className="w-full">
                        <CardBody className="flex flex-row items-center">
                            <div className="w-2/3">
                                <h2 className="text-xl font-bold mb-4">Monthly Distance with Trailer</h2>
                                <Line data={monthlyDistanceData} options={lineOptions} />
                            </div>
                            <div className="w-1/3 pl-8">
                                <h3 className="text-lg font-semibold mb-4">Distance Analysis</h3>
                                <ul className="space-y-3">
                                    <li>• Peak travel month: <span className="font-semibold">July</span> with 70 miles average</li>
                                    <li>• Winter months show <span className="font-semibold">60% less</span> trailer travel distance</li>
                                    <li>• Summer months account for <span className="font-semibold">40%</span> of annual trailer mileage</li>
                                </ul>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Usage Frequency Chart */}
                    <Card className="w-full">
                        <CardBody className="flex flex-row items-center">
                            <div className="w-2/3">
                                <h2 className="text-xl font-bold mb-4">Trailer Usage Frequency</h2>
                                <Bar data={usageFrequencyData} options={barOptions} />
                            </div>
                            <div className="w-1/3 pl-8">
                                <h3 className="text-lg font-semibold mb-4">Usage Patterns</h3>
                                <ul className="space-y-3">
                                    <li>• Highest usage frequency: <span className="font-semibold">{Math.max(...trailerUsageData.map(d => d.frequency))} times</span> in {trailerUsageData.find(d => d.frequency === Math.max(...trailerUsageData.map(d => d.frequency)))?.month}</li>
                                    <li>• Average monthly frequency: <span className="font-semibold">{(trailerUsageData.reduce((sum, d) => sum + d.frequency, 0) / trailerUsageData.length).toFixed(1)} times</span></li>
                                    <li>• Usage trend shows <span className="font-semibold">steady increase</span> through first half of year</li>
                                </ul>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <Card className="w-full mt-6">
                    <CardHeader>
                        <h2 className="text-xl font-bold">Usage Summary</h2>
                    </CardHeader>
                    <CardBody>
                        <p className="mb-4">
                            Your trailer usage patterns indicate primarily recreational use with peak activity during summer months. 
                            The data suggests your trailer is most commonly used for utility purposes, with an average monthly 
                            usage frequency of {(trailerUsageData.reduce((sum, d) => sum + d.frequency, 0) / trailerUsageData.length).toFixed(1)} times.
                        </p>
                        <p>
                            Based on your usage patterns, consider scheduling maintenance checks before the summer season 
                            begins to ensure optimal performance during peak usage periods.
                        </p>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
} 