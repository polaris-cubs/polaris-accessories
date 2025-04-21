"use client";

import React, { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
} from "chart.js";
import { Card, CardBody, CardHeader } from "@heroui/react";

import Sidebar from "@/components/sidebar/sidebar";
import { filterNonAccessories } from '@/lib/utils';

// Register required chart.js components
ChartJS.register(
    CategoryScale, 
    LinearScale, 
    BarElement, 
    ArcElement, 
    Title, 
    Tooltip, 
    Legend
);

// API response types
type AccessorySummary = {
    state: string;
    property_name: string;
    usage_count: number;
};

type VehicleSummary = {
    brand: string;
    rides: number;
    vehicles: number;
};

type VehicleAccessorySummary = {
    brand: string;
    property_name: string;
    usage_count: number;
};

type StateDetailItem = {
    state: string;
    property_name: string;
    usage_count: number;
};

export default function AccessoryComparison() {
    // State for API data
    const [accessorySummary, setAccessorySummary] = useState<AccessorySummary[]>([]);
    const [vehicleSummary, setVehicleSummary] = useState<VehicleSummary[]>([]);
    const [vehicleAccessories, setVehicleAccessories] = useState<VehicleAccessorySummary[]>([]);
    const [stateDetails, setStateDetails] = useState<Record<string, StateDetailItem[]>>({});
    const [selectedState, setSelectedState] = useState<string>("");
    const [selectedVehicle, setSelectedVehicle] = useState<string>("");
    const [availableStates, setAvailableStates] = useState<string[]>([]);
    const [availableVehicles, setAvailableVehicles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');

                // Fetch accessory data
                const accessoryResponse = await fetch('http://localhost:8080/api/accessory-summary');
                const accessoryData = await accessoryResponse.json();
                
                // Filter out non-accessory properties
                const filteredAccessoryData = filterNonAccessories<AccessorySummary>(accessoryData);

                setAccessorySummary(filteredAccessoryData);

                // Fetch vehicle data
                const vehicleResponse = await fetch('http://localhost:8080/api/vehicle-summary');
                const vehicleData = await vehicleResponse.json();

                setVehicleSummary(vehicleData);

                // Fetch vehicle accessory data
                const vehicleAccessoryResponse = await fetch('http://localhost:8080/api/vehicle-accessory-summary');
                const vehicleAccessoryData = await vehicleAccessoryResponse.json();
                
                // Filter out non-accessory properties
                const filteredVehicleAccessoryData = filterNonAccessories<VehicleAccessorySummary>(vehicleAccessoryData);

                setVehicleAccessories(filteredVehicleAccessoryData);

                // Extract available states and vehicles
                const states = Array.from(new Set(filteredAccessoryData.map(item => item.state))) as string[];

                setAvailableStates(states);

                const vehicles = Array.from(new Set(vehicleData.map((item: VehicleSummary) => item.brand))) as string[];

                setAvailableVehicles(vehicles);

                // Set initial selected state and vehicle if available
                if (states.length > 0) {
                    await fetchStateDetail(states[0]);
                    setSelectedState(states[0]);
                }

                if (vehicles.length > 0) {
                    setSelectedVehicle(vehicles[0]);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to fetch data. Please try again later.');
                setLoading(false);
            }
        };

        const fetchStateDetail = async (state: string) => {
            try {
                const stateDetailRes = await fetch(`http://localhost:8080/api/state-detail?state=${state}`);
                
                if (!stateDetailRes.ok) {
                    throw new Error(`Failed to fetch data for state: ${state}`);
                }
                
                const stateDetailJson = await stateDetailRes.json();
                
                // Use utility function to filter non-accessories
                const filteredStateDetails = filterNonAccessories<StateDetailItem>(stateDetailJson);
                
                // Update state details with the fetched data
                setStateDetails(prev => ({
                    ...prev,
                    [state]: filteredStateDetails
                }));
            } catch (err) {
                console.error(`Error fetching state detail for ${state}:`, err);
            }
        };

        fetchData();
    }, []);

    // Change handler for state selection
    const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newState = e.target.value;

        setSelectedState(newState);
        
        // Fetch state detail data if we don't have it yet
        if (!stateDetails[newState]) {
            try {
                const stateDetailRes = await fetch(`http://localhost:8080/api/state-detail?state=${newState}`);
                
                if (!stateDetailRes.ok) {
                    throw new Error(`Failed to fetch data for state: ${newState}`);
                }
                
                const stateDetailJson = await stateDetailRes.json();
                
                // Use utility function to filter non-accessories
                const filteredStateDetails = filterNonAccessories<StateDetailItem>(stateDetailJson);
                
                // Update state details with the fetched data
                setStateDetails(prev => ({
                    ...prev,
                    [newState]: filteredStateDetails
                }));
            } catch (err) {
                console.error(`Error fetching state detail for ${newState}:`, err);
            }
        }
    };

    // Change handler for vehicle selection
    const handleVehicleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVehicle = e.target.value;

        setSelectedVehicle(newVehicle);
        
        try {
            // API 엔드포인트 수정 - vehicle 파라미터 사용
            const vehicleAccessoriesRes = await fetch(`http://localhost:8080/api/accessory-summary?vehicle=${newVehicle}`);
            
            if (!vehicleAccessoriesRes.ok) {
                throw new Error(`Failed to fetch accessory data for ${newVehicle}`);
            }
            
            const vehicleAccessoriesJson = await vehicleAccessoriesRes.json();
            
            // Use utility function to filter non-accessories
            const filteredAccessories = filterNonAccessories<VehicleAccessorySummary>(vehicleAccessoriesJson);

            setVehicleAccessories(filteredAccessories);
        } catch (err) {
            console.error(`Error fetching accessories for ${newVehicle}:`, err);
            // 오류가 발생해도 빈 배열로 설정하여 UI가 깨지지 않도록 함
            setVehicleAccessories([]);
        }
    };

    if (loading) {
        return (
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6 ml-64">
                    <div className="p-4 text-center">Loading accessory data...</div>
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

    // Process data for the accessory comparison chart (bar chart)
    const accessoryComparisonData = {
        labels: Array.from(new Set(accessorySummary.map(item => item.property_name))),
        datasets: [
            {
                label: 'Total Usage Count',
                data: Array.from(new Set(accessorySummary.map(item => item.property_name))).map(
                    accessory => {
                        return accessorySummary
                            .filter(item => item.property_name === accessory)
                            .reduce((sum, item) => sum + item.usage_count, 0);
                    }
                ),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            }
        ]
    };

    // Process data for the accessory distribution by state (doughnut chart)
    const stateAccessoryDistributionData = {
        labels: availableStates,
        datasets: [
            {
                data: availableStates.map(
                    state => {
                        return accessorySummary
                            .filter(item => item.state === state)
                            .reduce((sum, item) => sum + item.usage_count, 0);
                    }
                ),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                ],
                borderWidth: 1,
            }
        ]
    };

    // Process data for the state-specific accessory usage (if selected state has data)
    const stateAccessoryData = selectedState && stateDetails[selectedState] ? {
        labels: stateDetails[selectedState].map(item => item.property_name),
        datasets: [
            {
                label: `${selectedState} Accessory Usage`,
                data: stateDetails[selectedState].map(item => item.usage_count),
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
            }
        ]
    } : null;

    // Process data for vehicle-specific accessory usage
    const vehicleAccessoryData = selectedVehicle ? {
        labels: Array.from(new Set(vehicleAccessories
            .filter(item => item.brand === selectedVehicle)
            .map(item => item.property_name))),
        datasets: [
            {
                label: `${selectedVehicle} Accessory Usage`,
                data: Array.from(new Set(vehicleAccessories
                    .filter(item => item.brand === selectedVehicle)
                    .map(item => item.property_name)))
                    .map(accessory => {
                        return vehicleAccessories
                            .filter(item => item.brand === selectedVehicle && item.property_name === accessory)
                            .reduce((sum, item) => sum + item.usage_count, 0);
                    }),
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1,
            }
        ]
    } : null;

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
                title: {
                    display: true,
                    text: "Usage Count"
                }
            },
            x: {
                title: {
                    display: true,
                    text: "Accessory Type"
                }
            }
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

    // Find top accessory overall and for selected state
    const topAccessory = accessorySummary.length > 0 
        ? Array.from(new Set(accessorySummary.map(item => item.property_name)))
            .map(accessory => ({
                name: accessory,
                count: accessorySummary
                    .filter(item => item.property_name === accessory)
                    .reduce((sum, item) => sum + item.usage_count, 0)
            }))
            .sort((a, b) => b.count - a.count)[0].name
        : 'None';

    const topStateAccessory = selectedState && stateDetails[selectedState] && stateDetails[selectedState].length > 0
        ? stateDetails[selectedState]
            .sort((a, b) => b.usage_count - a.usage_count)[0].property_name
        : 'None';

    // Find top accessory for selected vehicle
    const topVehicleAccessory = selectedVehicle && vehicleAccessories.length > 0
        ? Array.from(new Set(vehicleAccessories
            .filter(item => item.brand === selectedVehicle)
            .map(item => item.property_name)))
            .map(accessory => ({
                name: accessory,
                count: vehicleAccessories
                    .filter(item => item.brand === selectedVehicle && item.property_name === accessory)
                    .reduce((sum, item) => sum + item.usage_count, 0)
            }))
            .sort((a, b) => b.count - a.count)[0]?.name || 'None'
        : 'None';

    return (
        <div className="flex">
            <Sidebar />

            <div className="flex-1 p-6 ml-64">
                <h1 className="text-3xl font-bold mb-6">Accessory Usage Comparison</h1>

                <div className="flex flex-col space-y-6 mb-6">
                    {/* Overall Accessory Comparison */}
                    <Card className="w-full">
                        <CardHeader>
                            <h2 className="text-xl font-bold">Overall Accessory Usage</h2>
                        </CardHeader>
                        <CardBody className="flex flex-row items-center">
                            <div className="w-2/3">
                                <Bar data={accessoryComparisonData} options={barOptions} />
                            </div>
                            <div className="w-1/3 pl-8">
                                <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
                                <ul className="space-y-3">
                                    <li>• Most used accessory: <span className="font-semibold">{topAccessory}</span></li>
                                    <li>• Total accessory usage: <span className="font-semibold">
                                        {accessorySummary.reduce((sum, item) => sum + item.usage_count, 0)}
                                    </span></li>
                                    <li>• Number of unique accessories: <span className="font-semibold">
                                        {Array.from(new Set(accessorySummary.map(item => item.property_name))).length}
                                    </span></li>
                                </ul>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Accessory Distribution by State */}
                    <Card className="w-full">
                        <CardHeader>
                            <h2 className="text-xl font-bold">Accessory Usage Distribution by State</h2>
                        </CardHeader>
                        <CardBody className="flex flex-row items-center">
                            <div className="w-2/3">
                                <Doughnut data={stateAccessoryDistributionData} options={doughnutOptions} />
                            </div>
                            <div className="w-1/3 pl-8">
                                <h3 className="text-lg font-semibold mb-4">Regional Insights</h3>
                                <ul className="space-y-3">
                                    <li>• States tracked: <span className="font-semibold">{availableStates.length}</span></li>
                                    <li>• Highest usage state: <span className="font-semibold">
                                        {availableStates.length > 0 ? 
                                            availableStates
                                                .map(state => ({
                                                    name: state,
                                                    count: accessorySummary
                                                        .filter(item => item.state === state)
                                                        .reduce((sum, item) => sum + item.usage_count, 0)
                                                }))
                                                .sort((a, b) => b.count - a.count)[0].name
                                            : 'None'
                                        }
                                    </span></li>
                                </ul>
                            </div>
                        </CardBody>
                    </Card>

                    {/* State-Specific Analysis */}
                    <Card className="w-full">
                        <CardHeader className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">State-Specific Accessory Analysis</h2>
                            <div className="flex items-center space-x-2">
                                <label className="font-medium" htmlFor="state-select">Select State:</label>
                                <select 
                                    className="border border-gray-300 rounded-md p-2"
                                    id="state-select"
                                    value={selectedState}
                                    onChange={handleStateChange}
                                >
                                    {availableStates.map(state => (
                                        <option key={state} value={state}>
                                            {state}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </CardHeader>
                        <CardBody className="flex flex-row items-center">
                            {stateAccessoryData ? (
                                <>
                                    <div className="w-2/3">
                                        <Bar data={stateAccessoryData} options={barOptions} />
                                    </div>
                                    <div className="w-1/3 pl-8">
                                        <h3 className="text-lg font-semibold mb-4">{selectedState} Insights</h3>
                                        <ul className="space-y-3">
                                            <li>• Most used accessory: <span className="font-semibold">{topStateAccessory}</span></li>
                                            <li>• Total usage in {selectedState}: <span className="font-semibold">
                                                {stateDetails[selectedState].reduce((sum, item) => sum + item.usage_count, 0)}
                                            </span></li>
                                        </ul>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full text-center p-6">
                                    {selectedState ? 
                                        `No accessory data available for ${selectedState}` : 
                                        'Select a state to view accessory usage details'
                                    }
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Vehicle-Specific Accessory Analysis */}
                    <Card className="w-full">
                        <CardHeader className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Vehicle-Specific Accessory Analysis</h2>
                            <div className="flex items-center space-x-2">
                                <label className="font-medium" htmlFor="vehicle-select">Select Vehicle:</label>
                                <select 
                                    className="border border-gray-300 rounded-md p-2"
                                    id="vehicle-select"
                                    value={selectedVehicle}
                                    onChange={handleVehicleChange}
                                >
                                    {availableVehicles.map(vehicle => (
                                        <option key={vehicle} value={vehicle}>
                                            {vehicle}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </CardHeader>
                        <CardBody className="flex flex-row items-center">
                            {vehicleAccessoryData && vehicleAccessoryData.labels.length > 0 ? (
                                <>
                                    <div className="w-2/3">
                                        <Bar data={vehicleAccessoryData} options={barOptions} />
                                    </div>
                                    <div className="w-1/3 pl-8">
                                        <h3 className="text-lg font-semibold mb-4">{selectedVehicle} Insights</h3>
                                        <ul className="space-y-3">
                                            <li>• Most used accessory: <span className="font-semibold">{topVehicleAccessory}</span></li>
                                            <li>• Total accessory uses: <span className="font-semibold">
                                                {vehicleAccessories
                                                    .filter(item => item.brand === selectedVehicle)
                                                    .reduce((sum, item) => sum + item.usage_count, 0)}
                                            </span></li>
                                            <li>• Unique accessories used: <span className="font-semibold">
                                                {new Set(vehicleAccessories
                                                    .filter(item => item.brand === selectedVehicle)
                                                    .map(item => item.property_name)).size}
                                            </span></li>
                                        </ul>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full text-center p-6">
                                    {selectedVehicle ? 
                                        `No accessory data available for ${selectedVehicle}` : 
                                        'Select a vehicle to view accessory usage details'
                                    }
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                <Card className="w-full mt-6">
                    <CardHeader>
                        <h2 className="text-xl font-bold">Usage Summary</h2>
                    </CardHeader>
                    <CardBody>
                        <p className="mb-4">
                            This dashboard provides a comprehensive view of accessory usage across all states and vehicles.
                            The data shows that <span className="font-semibold">{topAccessory}</span> is the most utilized accessory overall.
                            {selectedState && stateDetails[selectedState] && stateDetails[selectedState].length > 0 && 
                                ` In ${selectedState}, the most commonly used accessory is ${topStateAccessory}.`
                            }
                            {selectedVehicle && topVehicleAccessory !== 'None' &&
                                ` For ${selectedVehicle} vehicles, ${topVehicleAccessory} is the most frequently used accessory.`
                            }
                        </p>
                        <p>
                            The accessory usage patterns vary by state and vehicle type, with regional and vehicle-specific differences 
                            likely influenced by factors such as climate, terrain, vehicle capabilities, and user preferences. 
                            This analysis can help guide product development and marketing strategies to better address 
                            customer needs across different regions and vehicle segments.
                        </p>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
} 