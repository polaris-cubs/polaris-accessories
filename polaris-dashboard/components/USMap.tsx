"use client";

import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { Tooltip } from "@heroui/react";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

export default function USMap() {
    return (
        <div className="relative">
            <ComposableMap className="w-full h-[600px] bg-white shadow-md rounded-lg" projection="geoAlbersUsa">
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map((geo) => (
                            <Tooltip key={geo.rsmKey} closeDelay={0} content={geo.properties.name} delay={0}>
                                <g>
                                    <Geography
                                        geography={geo}
                                        style={{
                                            default: {
                                                fill: "#E0E0E0",
                                                outline: "none",
                                            },
                                            hover: {
                                                fill: "#F53",
                                                outline: "none",
                                            },
                                            pressed: {
                                                fill: "#E42",
                                                outline: "none",
                                            },
                                        }}
                                    />
                                </g>
                            </Tooltip>
                        ))
                    }
                </Geographies>
            </ComposableMap>
        </div>
    );
}
