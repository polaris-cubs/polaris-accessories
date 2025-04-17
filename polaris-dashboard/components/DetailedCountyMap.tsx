"use client";

import React from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Tooltip } from "@nextui-org/react";
import { useRouter } from "next/navigation"; 
import { Button } from "@nextui-org/react";


// GeoJSON source for US counties
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/counties-10m.json";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

type StateNames = keyof typeof stateFipsMapping;

// Mapping of state names to their two-digit FIPS prefixes
const stateFipsMapping = {
    Alabama: "01",
    Alaska: "02",
    Arizona: "04",
    Arkansas: "05",
    California: "06",
    Colorado: "08",
    Connecticut: "09",
    Delaware: "10",
    Florida: "12",
    Georgia: "13",
    Hawaii: "15",
    Idaho: "16",
    Illinois: "17",
    Indiana: "18",
    Iowa: "19",
    Kansas: "20",
    Kentucky: "21",
    Louisiana: "22",
    Maine: "23",
    Maryland: "24",
    Massachusetts: "25",
    Michigan: "26",
    Minnesota: "27",
    Mississippi: "28",
    Missouri: "29",
    Montana: "30",
    Nebraska: "31",
    Nevada: "32",
    "New Hampshire": "33",
    "New Jersey": "34",
    "New Mexico": "35",
    "New York": "36",
    "North Carolina": "37",
    "North Dakota": "38",
    Ohio: "39",
    Oklahoma: "40",
    Oregon: "41",
    Pennsylvania: "42",
    "Rhode Island": "44",
    "South Carolina": "45",
    "South Dakota": "46",
    Tennessee: "47",
    Texas: "48",
    Utah: "49",
    Vermont: "50",
    Virginia: "51",
    Washington: "53",
    "West Virginia": "54",
    Wisconsin: "55",
    Wyoming: "56",
};

type StateCenter = {
    center: [number, number];
    zoom: number;
};

type StateCenterMapping = {
    [K in StateNames]: StateCenter;
};

// Approximate center coordinates and zoom levels for each state
const stateCenterMapping: StateCenterMapping = {
    Alabama: { center: [-86.9023, 32.3182], zoom: 5 },
    Alaska: { center: [-154.4931, 63.5887], zoom: 3 },
    Arizona: { center: [-111.0937, 34.0489], zoom: 5 },
    Arkansas: { center: [-92.3731, 34.9697], zoom: 5 },
    California: { center: [-119.4179, 36.7783], zoom: 5 },
    Colorado: { center: [-105.7821, 39.5501], zoom: 5 },
    Connecticut: { center: [-72.7554, 41.6032], zoom: 6 },
    Delaware: { center: [-75.5277, 38.9108], zoom: 7 },
    Florida: { center: [-81.5158, 27.6648], zoom: 5 },
    Georgia: { center: [-83.4419, 32.1656], zoom: 5 },
    Hawaii: { center: [-155.5828, 19.8968], zoom: 6 },
    Idaho: { center: [-114.742, 44.0682], zoom: 5 },
    Illinois: { center: [-89.3985, 40.6331], zoom: 5 },
    Indiana: { center: [-86.1349, 40.2672], zoom: 5 },
    Iowa: { center: [-93.0977, 41.878], zoom: 5 },
    Kansas: { center: [-98.4842, 38.9717], zoom: 5 },
    Kentucky: { center: [-84.27, 37.8393], zoom: 5 },
    Louisiana: { center: [-91.9623, 31.2448], zoom: 5 },
    Maine: { center: [-69.4455, 45.2538], zoom: 6 },
    Maryland: { center: [-76.6413, 39.0458], zoom: 5 },
    Massachusetts: { center: [-71.3824, 42.4072], zoom: 5 },
    Michigan: { center: [-85.6024, 44.3148], zoom: 5 },
    Minnesota: { center: [-94.6859, 46.7296], zoom: 5 },
    Mississippi: { center: [-89.3985, 32.3547], zoom: 5 },
    Missouri: { center: [-91.8318, 38.4561], zoom: 5 },
    Montana: { center: [-110.3626, 46.8797], zoom: 5 },
    Nebraska: { center: [-99.9018, 41.4925], zoom: 5 },
    Nevada: { center: [-116.4194, 38.8026], zoom: 5 },
    "New Hampshire": { center: [-71.5724, 43.1939], zoom: 6 },
    "New Jersey": { center: [-74.4057, 40.0583], zoom: 5 },
    "New Mexico": { center: [-105.8701, 34.5199], zoom: 5 },
    "New York": { center: [-74.2179, 43.2994], zoom: 5 },
    "North Carolina": { center: [-79.0193, 35.7596], zoom: 5 },
    "North Dakota": { center: [-101.002, 47.5515], zoom: 5 },
    Ohio: { center: [-82.9071, 40.4173], zoom: 5 },
    Oklahoma: { center: [-97.0929, 35.0078], zoom: 5 },
    Oregon: { center: [-120.5542, 43.8041], zoom: 5 },
    Pennsylvania: { center: [-77.1945, 41.2033], zoom: 5 },
    "Rhode Island": { center: [-71.4774, 41.5801], zoom: 7 },
    "South Carolina": { center: [-81.1637, 33.8361], zoom: 5 },
    "South Dakota": { center: [-99.9018, 43.9695], zoom: 5 },
    Tennessee: { center: [-86.5804, 35.5175], zoom: 5 },
    Texas: { center: [-99.9018, 31.9686], zoom: 4 },
    Utah: { center: [-111.0937, 39.32], zoom: 5 },
    Vermont: { center: [-72.5778, 44.5588], zoom: 6 },
    Virginia: { center: [-78.6569, 37.4316], zoom: 5 },
    Washington: { center: [-120.7401, 47.7511], zoom: 5 },
    "West Virginia": { center: [-80.4549, 38.5976], zoom: 5 },
    Wisconsin: { center: [-89.6165, 44.2685], zoom: 5 },
    Wyoming: { center: [-107.2903, 43.07597], zoom: 5 },
};

export interface DetailedCountyMapProps {
    state: string;
    vehicleData?: any;
    accessoryData?: any;
    isLoading?: boolean;
}

export default function DetailedCountyMap({ state, vehicleData, accessoryData, isLoading }: DetailedCountyMapProps) {
    const router = useRouter();

    const stateFips = stateFipsMapping[state as StateNames];
    const stateCenter = stateCenterMapping[state as StateNames];

    if (!stateFips) {
        return <div className="text-red-500">❌ No FIPS mapping available for {state}</div>;
    }

    const defaultCenter: [number, number] = [-98, 39];
    const { center, zoom } = stateCenter || { center: defaultCenter, zoom: 5 };

    return (
        <div className="w-full bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">{state} Geographic Overview</h2>
                <Button 
                    color="primary"
                    variant="light"
                    onClick={() => router.push('/')}
                >
                    ← Back to US Map
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-50 rounded-lg p-4 min-h-[600px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                                <p className="text-gray-600">Loading map data...</p>
                            </div>
                        </div>
                    ) : (
                        <ComposableMap className="w-full h-full" projection="geoAlbersUsa">
                            <ZoomableGroup center={center} zoom={zoom}>
                                <Geographies geography={geoUrl}>
                                    {({ geographies }) =>
                                        geographies
                                            .filter((geo) => geo.id && geo.id.startsWith(stateFips))
                                            .map((geo) => (
                                                <Tooltip 
                                                    key={geo.rsmKey} 
                                                    closeDelay={0}
                                                    content={geo.properties.name}
                                                    delay={0}
                                                    placement="top"
                                                >
                                                    <Geography
                                                        geography={geo}
                                                        stroke="#FFFFFF"
                                                        strokeWidth={0.2}
                                                        style={{
                                                            default: { fill: "#3B82F6", outline: "none" },
                                                            hover: { fill: "#1E40AF", outline: "none", cursor: "pointer" },
                                                            pressed: { fill: "#2563EB", outline: "none" },
                                                        }}
                                                    />
                                                </Tooltip>
                                            ))
                                    }
                                </Geographies>
                            </ZoomableGroup>
                        </ComposableMap>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">🚗 Vehicle Summary</h3>
                        {isLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            </div>
                        ) : !vehicleData ? (
                            <p className="text-gray-600 text-center py-4">No vehicle data available</p>
                        ) : (
                            <ul className="space-y-2">
                                {vehicleData.map((vehicle: any, index: number) => (
                                    <li key={index} className="flex items-center gap-2 text-gray-700">
                                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className="font-medium">{vehicle.brand}:</span>
                                        <span>{vehicle.rides} rides ({vehicle.vehicles} vehicles)</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">🔧 Accessories Overview</h3>
                        {isLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            </div>
                        ) : !accessoryData ? (
                            <p className="text-gray-600 text-center py-4">No accessory data available</p>
                        ) : (
                            <ul className="space-y-2">
                                {accessoryData.map((accessory: any, index: number) => (
                                    <li key={index} className="flex items-center gap-2 text-gray-700">
                                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                                        <span className="font-medium">{accessory.property_name}:</span>
                                        <span>{accessory.usage_count} uses</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}