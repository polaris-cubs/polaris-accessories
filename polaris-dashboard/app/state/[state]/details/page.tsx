'use client';

import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Link from 'next/link';
import { useParams } from 'next/navigation';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface StateData {
    totalVehicles: number;
    activeUsers: number;
    totalRides: number;
    monthlyUsage: number[];
}

export default function StateDetails() {
    const params = useParams();
    const stateId = params.state as string;
    const [data, setData] = useState<StateData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/state-data/${stateId.toLowerCase()}`);
                const jsonData = await response.json();

                setData(jsonData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [stateId]);

    if (loading) {
        return <div className="loading">Loading {stateId} data...</div>;
    }

    const chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Monthly Usage',
                data: data?.monthlyUsage || [],
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: `Monthly Vehicle Usage in ${stateId}`,
            },
        },
    };

    return (
        <div className="state-content">
            <div className="state-header">
                <Link 
                    className="back-button"
                    href="/"
                >
                    ← Back to US Map
                </Link>
                <h1>{stateId} State Data</h1>
            </div>
            
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Vehicles</h3>
                    <p>{data?.totalVehicles}</p>
                </div>
                <div className="stat-card">
                    <h3>Active Users</h3>
                    <p>{data?.activeUsers}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Rides</h3>
                    <p>{data?.totalRides}</p>
                </div>
            </div>

            <div className="chart-container">
                <Bar data={chartData} options={chartOptions} />
            </div>

            <div className="data-table">
                <h2>Recent Activity</h2>
                {/* Add data table component here */}
            </div>
        </div>
    );
} 