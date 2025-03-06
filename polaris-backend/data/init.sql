CREATE TABLE IF NOT EXISTS can_logs (
    id SERIAL PRIMARY KEY,
    vehicle_type TEXT NOT NULL,
    log_time TIMESTAMP NOT NULL,
    variable TEXT NOT NULL,
    value TEXT NOT NULL
);