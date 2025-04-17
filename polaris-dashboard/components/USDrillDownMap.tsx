"use client";

import React from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { useRouter } from "next/navigation";

interface USDrillDownMapProps {
    usSummary?: any;
    onStateSelect?: (state: string) => void;
}

const usGeoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const stateAbbrMapping: Record<string, string> = {
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
    Wyoming: "WY"
};

const stateLabelOffsets: Record<string, { dx: number; dy: number }> = {
    Vermont: { dx: 0, dy: -20 },
    "New Hampshire": { dx: 10, dy: -20 },
    Massachusetts: { dx: 10, dy: -20 },
    "Rhode Island": { dx: 10, dy: -20 },
    Connecticut: { dx: 10, dy: -20 },
    "New Jersey": { dx: 10, dy: -20 },
    Delaware: { dx: 10, dy: -20 },
    Maryland: { dx: 10, dy: -20 },
    "District of Columbia": { dx: 10, dy: -20 }
};

const dataStates = ["Wisconsin", "Indiana", "Minnesota", "Michigan", "Illinois"];

export default function USDrillDownMap({ usSummary, onStateSelect }: USDrillDownMapProps) {
    const router = useRouter();

    const handleStateClick = (stateName: string) => {
        if (onStateSelect) {
            onStateSelect(stateName);
        } else {
            router.push(`/state/${stateName}/details`);
        }
    };

    return (
        <div className="relative" style={{ width: "800px", height: "600px"}}>
            <ComposableMap projection="geoAlbersUsa" style={{ width: "800px", height: "450px" }}>
                <ZoomableGroup>
                    <Geographies geography={usGeoUrl}>
                        {({ geographies, projection }) => (
                            <>
                                {geographies.map(geo => {
                                    const stateName = geo.properties.name;
                                    const abbr = stateAbbrMapping[stateName];
                                    const centroid = geoCentroid(geo);
                                    const offset = stateLabelOffsets[stateName] || { dx: 0, dy: 0 };
                                    const projectedCentroid = projection(centroid);
                                    const hasData = dataStates.includes(stateName);
                                    
                                    if (!projectedCentroid) return null;
                                    const [x, y] = projectedCentroid;

                                    return (
                                        <React.Fragment key={geo.rsmKey}>
                                            <Geography
                                                fill={hasData ? "#084c94" : "#cbe9f2"}
                                                geography={geo}
                                                stroke="#FFF"
                                                strokeWidth={0.5}
                                                style={{
                                                    default: { outline: "none" },
                                                    hover: { outline: "none", fill: hasData ? "#063a72" : "#a8d7e4" },
                                                    pressed: { outline: "none", fill: "#666" }
                                                }}
                                                onClick={() => handleStateClick(stateName)}
                                            />
                                            <g transform={`translate(${x + offset.dx}, ${y + offset.dy})`}>
                                                <text
                                                    alignmentBaseline="middle"
                                                    fill={hasData ? "#FFF" : "#000"}
                                                    fontSize={10}
                                                    textAnchor="middle"
                                                >
                                                    {abbr}
                                                </text>
                                            </g>
                                        </React.Fragment>
                                    );
                                })}
                            </>
                        )}
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
        </div>
    );
}
