"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from '@nextui-org/react';

import DetailedCountyMap from "@/components/DetailedCountyMap";
import { StateDataCharts } from "@/components/StateDataCharts";

export default function StateDetails() {
    const params = useParams();
    const router = useRouter();
    const state = typeof params.state === 'string' ? params.state : '';

    if (!state) {
        return <div className="p-4 text-red-500">Invalid state parameter</div>;
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{state}</h1>
                <Button 
                    color="primary" 
                    onClick={() => router.push('/')}
                >
                    Back to US Map
                </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow p-4">
                    <DetailedCountyMap state={state} />
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <StateDataCharts state={state} />
                </div>
            </div>
        </div>
    );
} 