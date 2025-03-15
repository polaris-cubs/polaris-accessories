import os
import psycopg2
import pandas as pd
import json
import time

def wait_for_postgres(db_url, max_retries=10, delay=5):
    retries = 0
    while retries < max_retries:
        try:
            conn = psycopg2.connect(db_url)
            conn.close()
            print("✅ PostgreSQL is ready!")
            return
        except psycopg2.OperationalError:
            print(f"⏳ PostgreSQL not ready yet (attempt {retries+1}/{max_retries})... retrying in {delay} seconds.")
            time.sleep(delay)
            retries += 1
    print("❌ Failed to connect to PostgreSQL after multiple attempts.")
    exit(1)

def load_dim_customer(cursor, csv_path):
    df = pd.read_csv(csv_path)
    records = df.to_dict('records')
    sql = """
        INSERT INTO dim_customer (customer_id, state)
        VALUES (%s, %s)
        ON CONFLICT (customer_id) DO NOTHING
    """
    data = [(row['customer_id'], row['state']) for row in records]
    cursor.executemany(sql, data)
    print(f"Loaded {len(data)} rows into dim_customer")

def load_dim_property(cursor, csv_path):
    df = pd.read_csv(csv_path)
    records = df.to_dict('records')
    sql = """
        INSERT INTO dim_property (property_id, property_name, property_units)
        VALUES (%s, %s, %s)
        ON CONFLICT (property_id) DO NOTHING
    """
    data = [(row['property_id'], row['property_name'], row['property_units']) for row in records]
    cursor.executemany(sql, data)
    print(f"Loaded {len(data)} rows into dim_property")

def load_dim_vehicle(cursor, csv_path):
    df = pd.read_csv(csv_path)
    records = df.to_dict('records')
    sql = """
        INSERT INTO dim_vehicle (vehicle_id, brand)
        VALUES (%s, %s)
        ON CONFLICT (vehicle_id) DO NOTHING
    """
    data = [(row['vehicle_id'], row['brand']) for row in records]
    cursor.executemany(sql, data)
    print(f"Loaded {len(data)} rows into dim_vehicle")

def load_fact_vehicle_ride(cursor, csv_path):
    df = pd.read_csv(csv_path)
    # fact table columns: ride_id, customer_id, vehicle_id, event_timestamp, property_values
    records = df.to_dict('records')
    sql = """
        INSERT INTO fact_vehicle_ride (ride_id, customer_id, vehicle_id, event_timestamp)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (ride_id) DO NOTHING
    """
    data = [
        (
            row['ride_id'], 
            row['customer_id'], 
            row['vehicle_id'], 
            row['event_timestamp']
        )
        for row in records
    ]
    cursor.executemany(sql, data)
    print(f"Loaded {len(data)} rows into fact_vehicle_ride")
    return records  # Return records for later processing of property_values

def load_fact_ride_property(cursor, fact_records):
    sql = """
        INSERT INTO fact_ride_property (ride_id, property_id, value)
        VALUES (%s, %s, %s)
    """
    data = []
    count = 0
    for row in fact_records:
        ride_id = row['ride_id']
        try:
            # Parse the JSON array in the property_values column.
            property_values = json.loads(row['property_values'])
        except Exception as e:
            print(f"Error parsing JSON for ride_id {ride_id}: {e}")
            continue
        for prop in property_values:
            property_id = prop['id']
            value = prop['value']
            data.append((ride_id, property_id, value))
            count += 1
    if data:
        cursor.executemany(sql, data)
    print(f"Loaded {count} rows into fact_ride_property")

def main():
    # Get the database URL from environment variables
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL environment variable is not set")
        return

    # Wait until PostgreSQL is ready
    wait_for_postgres(db_url)

    # Connect to the database
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cursor = conn.cursor()

    # Define paths to CSV files
    base_path = "/app/csv"
    customer_csv = os.path.join(base_path, "data_dim_customer.csv")
    property_csv = os.path.join(base_path, "data_dim_property.csv")
    vehicle_csv = os.path.join(base_path, "data_dim_vehicle.csv")
    ride_csv = os.path.join(base_path, "data_fact_vehicle_ride.csv")

    # Load dimension tables
    load_dim_customer(cursor, customer_csv)
    load_dim_property(cursor, property_csv)
    load_dim_vehicle(cursor, vehicle_csv)

    # Load fact ride data and capture records for ride properties
    fact_records = load_fact_vehicle_ride(cursor, ride_csv)

    # Load ride property details by parsing JSON from property_values
    load_fact_ride_property(cursor, fact_records)

    cursor.close()
    conn.close()
    print("✅ Data loading complete.")

if __name__ == '__main__':
    main()