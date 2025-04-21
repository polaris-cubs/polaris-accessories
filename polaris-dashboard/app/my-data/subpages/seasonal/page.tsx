"use client";

import React, { useEffect, useState } from "react";
import { Bar, Line, Pie, Radar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    RadialLinearScale,
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
    RadialLinearScale,
    ArcElement, 
    Title, 
    Tooltip, 
    Legend
);

// Types for API responses
type SeasonalUsage = {
    season: string;
    accessory: string;
    usage_count: number;
};

// Sample data for seasonal accessory usage
const seasonalUsageData = {
    labels: ["Snowplow", "Spreader", "Winch", "Light Bar", "Audio", "Trailer"],
    datasets: [
        {
            label: 'Winter',
            data: [90, 85, 40, 70, 30, 20],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
        },
        {
            label: 'Spring',
            data: [10, 20, 60, 50, 65, 70],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        },
        {
            label: 'Summer',
            data: [5, 10, 70, 40, 90, 80],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
        },
        {
            label: 'Fall',
            data: [30, 50, 65, 60, 70, 50],
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1,
        },
    ],
};

// Sample data for monthly usage pattern
const monthlyUsageData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
        {
            label: 'Total Accessory Usage',
            data: [250, 230, 180, 160, 130, 120, 110, 150, 170, 190, 210, 240],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4,
            fill: true,
        }
    ],
};

// Sample data for radar chart - accessory performance by season
const radarChartData = {
    labels: ['Utility', 'Performance', 'Convenience', 'Safety', 'Fuel Efficiency', 'Noise Reduction'],
    datasets: [
        {
            label: 'Winter',
            data: [85, 70, 60, 90, 50, 40],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
        },
        {
            label: 'Summer',
            data: [60, 80, 75, 65, 80, 70],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
        }
    ],
};

// Sample data for pie chart - seasonal distribution
const seasonalDistributionData = {
    labels: ['Winter', 'Spring', 'Summer', 'Fall'],
    datasets: [
        {
            data: [35, 20, 30, 15],
            backgroundColor: [
                'rgba(54, 162, 235, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(255, 99, 132, 0.6)',
                'rgba(255, 159, 64, 0.6)',
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
        },
    ],
};

export default function SeasonalAnalysis() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Simulate data loading
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        
        return () => clearTimeout(timer);
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

    // Chart options
    const barOptions: ChartOptions<"bar"> = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: 'Accessory Usage by Season'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Usage Frequency"
                }
            },
            x: {
                title: {
                    display: true,
                    text: "Accessory"
                }
            }
        },
    };

    const lineOptions: ChartOptions<"line"> = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: 'Monthly Usage Pattern'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Usage Count"
                }
            }
        },
    };

    const radarOptions: ChartOptions<"radar"> = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: 'Accessory Performance by Season'
            }
        },
        scales: {
            r: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    stepSize: 20
                }
            }
        }
    };

    const pieOptions: ChartOptions<"pie"> = {
        responsive: true,
        plugins: {
            legend: {
                position: "right",
            },
            title: {
                display: true,
                text: 'Usage Distribution by Season'
            }
        }
    };

    return (
        <div className="flex">
            <Sidebar />

            <div className="flex-1 p-6 ml-64">
                <h1 className="text-3xl font-bold mb-6">Seasonal Usage Analysis</h1>

                <div className="flex flex-col space-y-6 mb-6">
                    {/* Seasonal Accessory Usage Chart */}
                    <Card className="w-full">
                        <CardBody className="flex flex-row items-center">
                            <div className="w-2/3">
                                <h2 className="text-xl font-bold mb-4">Accessory Usage by Season</h2>
                                <Bar data={seasonalUsageData} options={barOptions} />
                            </div>
                            <div className="w-1/3 pl-8">
                                <h3 className="text-lg font-semibold mb-4">Seasonal Trends</h3>
                                <ul className="space-y-3">
                                    <li>• <span className="font-semibold">Winter:</span> Heavy usage of snow-related accessories</li>
                                    <li>• <span className="font-semibold">Summer:</span> High usage of audio and trailer accessories</li>
                                    <li>• <span className="font-semibold">Light Bar:</span> Consistent usage across all seasons</li>
                                </ul>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Monthly Usage Pattern */}
                    <Card className="w-full">
                        <CardBody className="flex flex-row items-center">
                            <div className="w-2/3">
                                <h2 className="text-xl font-bold mb-4">Monthly Usage Pattern</h2>
                                <Line data={monthlyUsageData} options={lineOptions} />
                            </div>
                            <div className="w-1/3 pl-8">
                                <h3 className="text-lg font-semibold mb-4">Monthly Insights</h3>
                                <ul className="space-y-3">
                                    <li>• Peak usage months: <span className="font-semibold">December-February</span></li>
                                    <li>• Lowest usage: <span className="font-semibold">June-August</span></li>
                                    <li>• Gradual increase beginning in <span className="font-semibold">September</span></li>
                                </ul>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Winter vs Summer Comparison */}
                    <Card className="w-full">
                        <CardBody className="flex flex-row items-center">
                            <div className="w-2/3">
                                <h2 className="text-xl font-bold mb-4">Winter vs Summer Performance</h2>
                                <Radar data={radarChartData} options={radarOptions} />
                            </div>
                            <div className="w-1/3 pl-8">
                                <h3 className="text-lg font-semibold mb-4">Comparative Analysis</h3>
                                <ul className="space-y-3">
                                    <li>• <span className="font-semibold">Winter:</span> Higher safety and utility scores</li>
                                    <li>• <span className="font-semibold">Summer:</span> Better fuel efficiency and noise reduction</li>
                                    <li>• <span className="font-semibold">Performance:</span> Superior in summer conditions</li>
                                </ul>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Seasonal Distribution */}
                    <Card className="w-full">
                        <CardBody className="flex flex-row items-center">
                            <div className="w-2/3">
                                <h2 className="text-xl font-bold mb-4">Usage Distribution by Season</h2>
                                <Pie data={seasonalDistributionData} options={pieOptions} />
                            </div>
                            <div className="w-1/3 pl-8">
                                <h3 className="text-lg font-semibold mb-4">Distribution Insights</h3>
                                <ul className="space-y-3">
                                    <li>• <span className="font-semibold">Winter (35%):</span> Highest overall accessory usage</li>
                                    <li>• <span className="font-semibold">Summer (30%):</span> Second highest usage period</li>
                                    <li>• <span className="font-semibold">Fall (15%):</span> Lowest overall accessory usage</li>
                                </ul>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <Card className="w-full mt-6">
                    <CardHeader>
                        <h2 className="text-xl font-bold">Seasonal Usage Summary</h2>
                    </CardHeader>
                    <CardBody>
                        <p className="mb-4">
                            Your accessory usage patterns display strong seasonal variation. Winter months show the highest overall 
                            accessory usage (35%), with snow-related accessories dominating. Summer follows with 30% of annual usage, 
                            primarily attributed to recreational accessories like audio systems and trailers.
                        </p>
                        <p>
                            For optimal performance year-round, consider seasonal maintenance checks before winter and summer, 
                            the two seasons with highest accessory utilization. Your accessories demonstrate different performance 
                            characteristics by season, with winter accessories providing better safety features and summer 
                            accessories offering improved fuel efficiency.
                        </p>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
} 