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

import Sidebar from '@/components/sidebar/sidebar';
import './us-map.css';

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

export default function USMap() {
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [data, setData] = useState<StateData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedState) {
            const fetchData = async () => {
                try {
                    const response = await fetch(`http://localhost:8080/api/state-data/${selectedState.toLowerCase()}`);
                    const jsonData = await response.json();

                    setData(jsonData);
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
    }, [selectedState]);

    const states = [
        { id: 'illinois', name: 'Illinois' },
        { id: 'indiana', name: 'Indiana' },
        { id: 'michigan', name: 'Michigan' },
        { id: 'minnesota', name: 'Minnesota' },
        { id: 'wisconsin', name: 'Wisconsin' }
    ];

    if (!selectedState) {
        return (
            <div className="state-container">
                <Sidebar />
                <main className="main-content">
                    <h1>US Map</h1>
                    <div className="states-grid">
                        {states.map(state => (
                            <Link 
                                key={state.id} 
                                className="state-card"
                                href={`/states/${state.id}`}
                            >
                                <h2>{state.name}</h2>
                            </Link>
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    if (loading) {
        return <div className="loading">Loading {selectedState} data...</div>;
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
                text: `Monthly Vehicle Usage in ${selectedState.charAt(0).toUpperCase() + selectedState.slice(1)}`,
            },
        },
    };

    return (
        <div className="state-container">
            <Sidebar />
            <main className="main-content">
                <div className="state-header">
                    <button 
                        className="back-button"
                        onClick={() => setSelectedState(null)}
                    >
                        ← Back to US Map
                    </button>
                    <h1>{selectedState.charAt(0).toUpperCase() + selectedState.slice(1)} State Data</h1>
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
            </main>
        </div>
    );
} 