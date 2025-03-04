CREATE TABLE IF NOT EXISTS can_data (
    id SERIAL PRIMARY KEY,
    time TIMESTAMP NOT NULL,
    vehicle_vin TEXT NOT NULL,
    variable TEXT NOT NULL,
    value TEXT NOT NULL,
    vehicle_type TEXT NOT NULL
);
