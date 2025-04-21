"use client";

import React from "react";
import { ComposableMap, Geographies, Geography, Annotation, ZoomableGroup } from "react-simple-maps";
import { Popover, PopoverTrigger, PopoverContent, Button } from "@heroui/react";
import { geoCentroid } from "d3-geo";

const usGeoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";


const stateAbbrMapping = {
    Alabama: "AL",
    Alaska: "AK",
    Arizona: "AZ",
    Arkansas: "AR",
    California: "CA",
    Colorado: "CO",
    Connecticut: "CT",
    Delaware: "DE",
    "District of Columbia": "DC",
    Florida: "FL",
    Georgia: "GA",
    Hawaii: "HI",
    Idaho: "ID",
    Illinois: "IL",
    Indiana: "IN",
    Iowa: "IA",
    Kansas: "KS",
    Kentucky: "KY",
    Louisiana: "LA",
    Maine: "ME",
    Maryland: "MD",
    Massachusetts: "MA",
    Michigan: "MI",
    Minnesota: "MN",
    Mississippi: "MS",
    Missouri: "MO",
    Montana: "MT",
    Nebraska: "NE",
    Nevada: "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    Ohio: "OH",
    Oklahoma: "OK",
    Oregon: "OR",
    Pennsylvania: "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    Tennessee: "TN",
    Texas: "TX",
    Utah: "UT",
    Vermont: "VT",
    Virginia: "VA",
    Washington: "WA",
    "West Virginia": "WV",
    Wisconsin: "WI",
    Wyoming: "WY",
};

const labelOffsets = {
    Vermont: { dx: 50, dy: -10 },
    "New Hampshire": { dx: 60, dy: 0 },
    Massachusetts: { dx: 40, dy: -10 },
    "Rhode Island": { dx: 40, dy: 0 },
    Connecticut: { dx: 40, dy: 30 },
    "New Jersey": { dx: 40, dy: 20 },
    Delaware: { dx: 40, dy: 20 },
    Maryland: { dx: 40, dy: 30 },
    "District of Columbia": { dx: 50, dy: 50 },
};



export default function USDrillDownMap({ usSummary, onStateSelect }) {
    
    return (
        <div className="relative" style={{ width: "800px", height: "600px"}}>
            <ComposableMap projection="geoAlbersUsa" style={{ width: "800px", height: "450px" }}>
                <ZoomableGroup>
                    <Geographies geography={usGeoUrl}>
                        {({ geographies, projection }) =>
                            geographies.map((geo) => {
                                const stateName = geo.properties.name;
                                const abbr = stateAbbrMapping[stateName] || stateName;
                                const centroid = geoCentroid(geo);
                                const [cx, cy] = projection(centroid) || [];
                                const offset = labelOffsets[stateName] || { dx: 0, dy: 0 };
                                const connector =
                                    offset.dx !== 0 || offset.dy !== 0
                                        ? { stroke: "#57a2b5", strokeWidth: 1, strokeLinecap: "round" }
                                        : { stroke: "none" };

                                // Find aggregated data for the state if available.
                                const stateData = usSummary.find((s) => s.state === stateName);
                                const popoverContent = (
                                    <div className="p-2">
                                        <div className="text-sm font-bold">{stateName}</div>
                                        {stateData && (
                                            <>
                                                <div className="text-xs mt-2">
                                                    Vehicles: {stateData.vehicles} <br />
                                                    Rides: {stateData.rides} <br />
                                                    Customers: {stateData.customers}
                                                    {stateData.brand_averages && (
                                                        // <>
                                                        //     <br />
                                                        //     {stateData.brand_averages.map((brandObj) => (
                                                        //         <>
                                                        //             <div className="text-xs mt-2">
                                                        //                 {brandObj.brand} <br />
                                                        //                 <ul>
                                                        //                     <li>Rides: {brandObj.rides}</li>
                                                        //                     <li>Vehicles: {brandObj.vehicles}</li>
                                                        //                     <li>Avg Rides: {brandObj.avg_rides}</li>
                                                        //                 </ul>
                                                        //             </div>
                                                        //         </>
                                                        //     ))}
                                                        // </>
                                                        <>
                                                            {stateData.brand_averages.map((brandObj) => (
                                                                <div key={brandObj.brand} className="text-xs">
                                                                    {brandObj.brand}: {brandObj.vehicles}
                                                                </div>
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        <div className="pt-2">
                                            <Button
                                                className="bg-[#084c94] text-white"
                                                size="sm"
                                                variant="flat"
                                                onPress={() => onStateSelect(stateName)}
                                            >
                                                View state details
                                            </Button>
                                        </div>
                                    </div>
                                );

                                return (
                                    <g key={geo.rsmKey}>
                                        <Popover
                                            containerPadding={0}
                                            placement="top"
                                            portalContainer={document.body}
                                            triggerScaleOnOpen={false}
                                        >
                                            <PopoverTrigger>
                                                <g style={{ cursor: "pointer" }}>
                                                    <Geography
                                                        fill="#cbe9f2"
                                                        geography={geo}
                                                        stroke="#FFFFFF"
                                                        strokeWidth={1}
                                                        style={{
                                                            default: { outline: "none" },
                                                            hover: { outline: "none", fill: "#084c94" },
                                                            pressed: { outline: "none", fill: "#B0BEC5" },
                                                        }}
                                                    />
                                                    {cx && cy && (
                                                        <Annotation
                                                            connectorProps={connector}
                                                            dx={offset.dx}
                                                            dy={offset.dy}
                                                            subject={centroid}
                                                        >
                                                            <text
                                                                alignmentBaseline="middle"
                                                                fill="#57a2b5"
                                                                fontSize={12}
                                                                fontWeight="bold"
                                                                style={{ pointerEvents: "none" }}
                                                                textAnchor={offset.dx !== 0 || offset.dy !== 0 ? "end" : "middle"}
                                                                x={offset.dx !== 0 || offset.dy !== 0 ? "20" : undefined}
                                                            >
                                                                {abbr}
                                                            </text>
                                                        </Annotation>
                                                    )}
                                                </g>
                                            </PopoverTrigger>
                                            <PopoverContent>{popoverContent}</PopoverContent>
                                        </Popover>
                                    </g>
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
        </div>
    );
}
