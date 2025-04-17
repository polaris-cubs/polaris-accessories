"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from '@nextui-org/react';

import DetailedCountyMap from "@/components/DetailedCountyMap";
import { StateDataCharts } from "@/components/StateDataCharts";
import Sidebar from "@/components/sidebar/sidebar";

export default function StateDetails() {
    const params = useParams();
    const router = useRouter();
    const state = typeof params.state === 'string' ? params.state : '';

    if (!state) {
        return <div className="p-4 text-red-500">Invalid state parameter</div>;
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-[256px]">
                <div className="p-8">
                    <Button 
                        className="mb-6" 
                        color="primary"
                        onClick={() => router.push('/')}
                    >
                        Back to US Map
                    </Button>
                    
                    <div className="flex flex-col gap-8">
                        <DetailedCountyMap state={state} />
                        <StateDataCharts state={state} />
                    </div>
                </div>
            </div>
        </div>
    );
} 