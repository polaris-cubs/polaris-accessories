"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from '@nextui-org/react';
import useSWR from 'swr';

import DetailedCountyMap from "@/components/DetailedCountyMap";
import StateDataCharts from "@/components/StateDataCharts";
import Sidebar from "@/components/sidebar/sidebar";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function StateDetails() {
    const params = useParams();
    const router = useRouter();
    const state = typeof params.state === 'string' ? params.state : '';

    // Parallel data fetching with SWR
    const { data: vehicleData, isLoading: isLoadingVehicle } = useSWR(
        state ? `http://localhost:8080/api/vehicle-summary?state=${encodeURIComponent(state)}` : null,
        fetcher
    );
    
    const { data: accessoryData, isLoading: isLoadingAccessory } = useSWR(
        state ? `http://localhost:8080/api/accessory-summary?state=${encodeURIComponent(state)}` : null,
        fetcher
    );

    if (!state) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 ml-[256px] p-8">
                    <div className="text-red-500 bg-red-50 p-4 rounded-lg">Invalid state parameter</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-[256px]">
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-gray-800">{state} State Analysis</h1>
                        <Button 
                            className="px-6"
                            color="primary"
                            variant="flat"
                            onClick={() => router.push('/')}
                        >
                            ← Back to Overview
                        </Button>
                    </div>
                    
                    <div className="space-y-6">
                        <DetailedCountyMap 
                            accessoryData={accessoryData}
                            isLoading={isLoadingVehicle || isLoadingAccessory}
                            state={state}
                            vehicleData={vehicleData}
                        />
                        <StateDataCharts 
                            accessoryData={accessoryData}
                            isLoading={isLoadingVehicle || isLoadingAccessory}
                            state={state}
                            vehicleData={vehicleData}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
} 