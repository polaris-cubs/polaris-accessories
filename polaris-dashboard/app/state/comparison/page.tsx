"use client";

import React from "react";
import useSWR from "swr";
import { Card, CardBody, CardHeader, Divider, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const states = ["Wisconsin", "Minnesota", "Illinois", "Indiana", "Michigan"];

export default function StateComparisonPage() {
    const { data: stateData } = useSWR(
        "http://localhost:8080/api/us-summary",
        fetcher
    );

    // Calculate average rides per vehicle for each state
    const stateMetrics = stateData
        ?.filter((state: any) => states.includes(state.state))
        .map((state: any) => ({
            ...state,
            avgRidesPerVehicle: (state.rides / state.vehicles).toFixed(2),
        }))
        .sort((a: any, b: any) => b.rides - a.rides);

    return (
        <div className="flex flex-col items-center p-6 gap-6">
            <Card className="w-full max-w-6xl">
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-2xl font-bold">State Comparison Dashboard</p>
                        <p className="text-sm text-gray-500">Key metrics comparison for the 5 states</p>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody>
                    <Table aria-label="State comparison table">
                        <TableHeader>
                            <TableColumn>State</TableColumn>
                            <TableColumn>Total Rides</TableColumn>
                            <TableColumn>Total Vehicles</TableColumn>
                            <TableColumn>Avg. Rides per Vehicle</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {stateMetrics?.map((state: any) => (
                                <TableRow key={state.state}>
                                    <TableCell>{state.state}</TableCell>
                                    <TableCell>{state.rides.toLocaleString()}</TableCell>
                                    <TableCell>{state.vehicles.toLocaleString()}</TableCell>
                                    <TableCell>{state.avgRidesPerVehicle}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                {stateMetrics?.map((state: any) => (
                    <Card key={state.state} className="w-full">
                        <CardHeader className="flex gap-3">
                            <div className="flex flex-col">
                                <p className="text-xl font-semibold">{state.state}</p>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Total Rides:</span>
                                    <span className="font-semibold">{state.rides.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Total Vehicles:</span>
                                    <span className="font-semibold">{state.vehicles.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Avg. Rides per Vehicle:</span>
                                    <span className="font-semibold">{state.avgRidesPerVehicle}</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>
        </div>
    );
} 