-- DROP TABLE IF EXISTS dim_customer;
-- DROP TABLE IF EXISTS dim_property;
-- DROP TABLE IF EXISTS dim_vehicle;
-- DROP TABLE IF EXISTS fact_vehicle_ride;

-- dim_customer
CREATE TABLE dim_customer (
  customer_id INTEGER PRIMARY KEY,
  state TEXT NOT NULL
);

-- dim_property
CREATE TABLE dim_property (
  property_id INTEGER PRIMARY KEY,
  property_name TEXT NOT NULL,
  property_units TEXT NOT NULL
);

-- dim_vehicle
CREATE TABLE dim_vehicle (
  vehicle_id TEXT PRIMARY KEY,
  brand TEXT NOT NULL
);

-- fact_vehicle_ride
CREATE TABLE fact_vehicle_ride (
  ride_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  vehicle_id TEXT NOT NULL,
  event_timestamp TEXT NOT NULL,   -- stored as text; can parse with strftime in SQLite
  property_values TEXT NOT NULL,    -- JSON array as text
  PRIMARY KEY (ride_id, event_timestamp),
  FOREIGN KEY (customer_id) REFERENCES dim_customer(customer_id),
  FOREIGN KEY (vehicle_id) REFERENCES dim_vehicle(vehicle_id)
);
