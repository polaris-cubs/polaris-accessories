export interface VehicleSummary {
    brand: string;
    rides: number;
    unique_vehicles: number;
}

export interface AccessorySummary {
    accessory_name: string;
    usage_count: number;
}

export interface RideSummary {
    rides: number;
    vehicle_id: string;
    customer_id: string;
    timestamp: string;
}

export interface CountyData {
    county: string;
    total_rides: number;
    coordinates: [number, number];
}

export interface TimeSeriesData {
    timestamp: string;
    value: number;
} 