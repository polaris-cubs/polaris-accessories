"use client";

import React from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Tooltip } from "@heroui/react";

// GeoJSON source for US counties
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/counties-10m.json";

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

// Approximate center coordinates and zoom levels for each state
const stateCenterMapping = {
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

export default function DetailedCountyMap({ stateName = "Illinois" }) {
    const stateFips = stateFipsMapping[stateName];

    if (!stateFips) {
        return <div>No FIPS mapping available for {stateName}</div>;
    }

    const { center, zoom } = stateCenterMapping[stateName] || { center: [-98, 39], zoom: 5 };

    return (
        <div className="relative justify-items-center">
            <ComposableMap className="w-full h-[700px] w-[700px] bg-white shadow-md rounded-lg" projection="geoAlbersUsa">
                <ZoomableGroup center={center} zoom={zoom}>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies
                                .filter((geo) => geo.id && geo.id.startsWith(stateFips))
                                .map((geo) => (
                                    <Tooltip key={geo.rsmKey} closeDelay={0} content={geo.properties.name} delay={0}>
                                        <Geography
                                            geography={geo}
                                            style={{
                                                default: { fill: "#cbe9f2", outline: "none" },
                                                hover: { fill: "#084c94", outline: "none" },
                                                pressed: { fill: "#E42", outline: "none" },
                                            }}
                                        />
                                    </Tooltip>
                                ))
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
        </div>
    );
}
