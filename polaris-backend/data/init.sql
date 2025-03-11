-- Customer Dimension Table
CREATE TABLE IF NOT EXISTS dim_customer (
    customer_id BIGINT PRIMARY KEY,
    state TEXT NOT NULL
);

-- Vehicle Dimension Table
CREATE TABLE IF NOT EXISTS dim_vehicle (
    vehicle_id TEXT PRIMARY KEY,
    brand TEXT NOT NULL
);

-- Property Dimension Table
CREATE TABLE IF NOT EXISTS dim_property (
    property_id INTEGER PRIMARY KEY,
    property_name TEXT NOT NULL,
    property_units TEXT NOT NULL
);

-- Fact Table for Vehicle Rides
CREATE TABLE IF NOT EXISTS fact_vehicle_ride (
    ride_id BIGINT PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES dim_customer(customer_id),
    vehicle_id TEXT NOT NULL REFERENCES dim_vehicle(vehicle_id),
    event_timestamp TIMESTAMP NOT NULL
);

-- Fact Table for Ride Properties
CREATE TABLE IF NOT EXISTS fact_ride_property (
    ride_property_id SERIAL PRIMARY KEY,
    ride_id BIGINT NOT NULL REFERENCES fact_vehicle_ride(ride_id),
    property_id INTEGER NOT NULL REFERENCES dim_property(property_id),
    value NUMERIC NOT NULL
);
