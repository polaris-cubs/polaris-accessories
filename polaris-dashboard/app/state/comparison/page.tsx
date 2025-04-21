"use client";

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from "@heroui/react";
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface StateSummary {
    state: string;
    rides: number;
    vehicles: number;
}

const states = ["Wisconsin", "Minnesota", "Illinois", "Indiana", "Michigan"];

export default function StateComparison() {
    const [summaries, setSummaries] = useState<StateSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/us-summary');
                const data = await response.json();
                
                const transformedData = data
                    .filter((item: any) => states.includes(item.state))
                    .map((item: any) => ({
                        state: item.state,
                        rides: item.rides || 0,
                        vehicles: item.vehicles || 0
                    }));

                setSummaries(transformedData);
            } catch (err) {
                setError('Failed to fetch state summaries');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    // Prepare data for charts
    const labels = summaries.map(s => s.state);
    const ridesData = summaries.map(s => s.rides);
    const vehiclesData = summaries.map(s => s.vehicles);
    const avgRidesData = summaries.map(s => s.vehicles > 0 ? s.rides / s.vehicles : 0);

    const barChartData = {
        labels,
        datasets: [
            {
                label: 'Total Rides',
                data: ridesData,
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                borderColor: 'rgb(53, 162, 235)',
                borderWidth: 1,
            }
        ]
    };

    const vehicleChartData = {
        labels,
        datasets: [
            {
                label: 'Total Vehicles',
                data: vehiclesData,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1,
            }
        ]
    };

    const avgRidesChartData = {
        labels,
        datasets: [
            {
                label: 'Average Rides per Vehicle',
                data: avgRidesData,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 1,
            }
        ]
    };

    const pieChartData = {
        labels,
        datasets: [
            {
                data: ridesData,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    // 데이터 인사이트 계산
    const getInsights = () => {
        if (summaries.length === 0) return null;

        const totalRides = summaries.reduce((sum, s) => sum + s.rides, 0);
        const totalVehicles = summaries.reduce((sum, s) => sum + s.vehicles, 0);
        
        const maxRidesState = summaries.reduce((prev, curr) => 
            prev.rides > curr.rides ? prev : curr
        );

        const maxVehiclesState = summaries.reduce((prev, curr) => 
            prev.vehicles > curr.vehicles ? prev : curr
        );

        const avgRidesPerVehicle = summaries.map(s => ({
            state: s.state,
            avg: s.vehicles > 0 ? s.rides / s.vehicles : 0
        }));
        
        const maxEfficiencyState = avgRidesPerVehicle.reduce((prev, curr) => 
            prev.avg > curr.avg ? prev : curr
        );

        return {
            totalRides,
            totalVehicles,
            maxRidesState,
            maxVehiclesState,
            maxEfficiencyState
        };
    };

    const insights = getInsights();

    return (
        <div className="flex-1 p-6 ml-64">
            <h1 className="text-3xl font-bold mb-6">State Comparison Dashboard</h1>
            
            <div className="flex flex-col space-y-6 mb-6">
                {/* Total Rides Chart */}
                <Card className="w-full">
                    <CardBody className="flex flex-row items-center">
                        <div className="w-2/3">
                            <h2 className="text-xl font-bold mb-4">Total Rides by State</h2>
                            <Bar data={barChartData} options={chartOptions} />
                        </div>
                        <div className="w-1/3 pl-8">
                            <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
                            <ul className="space-y-3">
                                <li>• Total rides across all states: <span className="font-semibold">{insights?.totalRides.toLocaleString()}</span></li>
                                <li>• Leading state: <span className="font-semibold">{insights?.maxRidesState.state}</span> with {insights?.maxRidesState.rides.toLocaleString()} rides</li>
                                <li>• This represents {((insights?.maxRidesState.rides || 0) / (insights?.totalRides || 1) * 100).toFixed(1)}% of total rides</li>
                            </ul>
                        </div>
                    </CardBody>
                </Card>

                {/* Total Vehicles Chart */}
                <Card className="w-full">
                    <CardBody className="flex flex-row items-center">
                        <div className="w-2/3">
                            <h2 className="text-xl font-bold mb-4">Total Vehicles by State</h2>
                            <Bar data={vehicleChartData} options={chartOptions} />
                        </div>
                        <div className="w-1/3 pl-8">
                            <h3 className="text-lg font-semibold mb-4">Vehicle Distribution</h3>
                            <ul className="space-y-3">
                                <li>• Total vehicles deployed: <span className="font-semibold">{insights?.totalVehicles.toLocaleString()}</span></li>
                                <li>• Highest vehicle count: <span className="font-semibold">{insights?.maxVehiclesState.state}</span> with {insights?.maxVehiclesState.vehicles.toLocaleString()} vehicles</li>
                                <li>• Average vehicles per state: {((insights?.totalVehicles || 0) / 5).toFixed(0)}</li>
                            </ul>
                        </div>
                    </CardBody>
                </Card>

                {/* Average Rides per Vehicle Chart */}
                <Card className="w-full">
                    <CardBody className="flex flex-row items-center">
                        <div className="w-2/3">
                            <h2 className="text-xl font-bold mb-4">Average Rides per Vehicle</h2>
                            <Bar data={avgRidesChartData} options={chartOptions} />
                        </div>
                        <div className="w-1/3 pl-8">
                            <h3 className="text-lg font-semibold mb-4">Efficiency Analysis</h3>
                            <ul className="space-y-3">
                                <li>• Most efficient state: <span className="font-semibold">{insights?.maxEfficiencyState.state}</span></li>
                                <li>• Average rides per vehicle: <span className="font-semibold">{insights?.maxEfficiencyState.avg.toFixed(2)}</span></li>
                                <li>• This suggests optimal vehicle utilization in {insights?.maxEfficiencyState.state}</li>
                            </ul>
                        </div>
                    </CardBody>
                </Card>

                {/* Ride Distribution Chart */}
                <Card className="w-full">
                    <CardBody className="flex flex-row items-center">
                        <div className="w-2/3">
                            <h2 className="text-xl font-bold mb-4">Ride Distribution</h2>
                            <Pie data={pieChartData} />
                        </div>
                        <div className="w-1/3 pl-8">
                            <h3 className="text-lg font-semibold mb-4">Distribution Analysis</h3>
                            <ul className="space-y-3">
                                <li>• Shows relative market share of each state</li>
                                <li>• Dominant market: <span className="font-semibold">{insights?.maxRidesState.state}</span></li>
                                <li>• This visualization helps identify potential market expansion opportunities</li>
                            </ul>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Summary Table */}
            <Card className="w-full">
                <CardHeader>
                    <h2 className="text-xl font-bold">Detailed Comparison</h2>
                </CardHeader>
                <CardBody>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3">State</th>
                                    <th className="text-right p-3">Total Rides</th>
                                    <th className="text-right p-3">Total Vehicles</th>
                                    <th className="text-right p-3">Avg. Rides/Vehicle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaries.map(summary => (
                                    <tr key={summary.state} className="border-b">
                                        <td className="p-3 font-medium">{summary.state}</td>
                                        <td className="text-right p-3">{summary.rides.toLocaleString()}</td>
                                        <td className="text-right p-3">{summary.vehicles.toLocaleString()}</td>
                                        <td className="text-right p-3">
                                            {(summary.vehicles > 0 ? summary.rides / summary.vehicles : 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
} 