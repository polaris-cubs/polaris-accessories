import psycopg2
import pandas as pd
import os
import time
from datetime import datetime

# Database connection details
DB_NAME = "polaris"
DB_USER = "polaris_user"
DB_PASSWORD = "polaris_password"
DB_HOST = "postgres"
DB_PORT = "5432"

def convert_time_format(time_str, default_date="2000-01-01"):
    """
    Convert a time string (e.g., "2:37:30 PM") to a TIMESTAMP string (e.g., "1900-01-01 14:37:30").
    """
    try:
        t = datetime.strptime(time_str, "%I:%M:%S %p")
        combined = datetime.strptime(f"{default_date} {t.strftime('%H:%M:%S')}", "%Y-%m-%d %H:%M:%S")
        return combined.strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        print(f"⚠️ Invalid time format: {time_str}, skipping row.")
        return None

# Wait for PostgreSQL to be ready
MAX_RETRIES = 10
for attempt in range(MAX_RETRIES):
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.autocommit = True
        print("✅ Successfully connected to PostgreSQL!")
        break
    except psycopg2.OperationalError:
        print(f"⏳ PostgreSQL not ready yet (attempt {attempt+1}/{MAX_RETRIES})... retrying in 5s")
        time.sleep(5)
else:
    print("❌ Could not connect to PostgreSQL after multiple attempts.")
    exit(1)

cursor = conn.cursor()

# Wait for the table "can_logs" to exist
TABLE_RETRIES = 10
for attempt in range(TABLE_RETRIES):
    try:
        cursor.execute("SELECT to_regclass('public.can_logs');")
        result = cursor.fetchone()
        if result and result[0] is not None:
            print("✅ Table 'can_logs' is ready!")
            break
        else:
            raise psycopg2.errors.UndefinedTable
    except psycopg2.Error:
        print(f"⏳ Table 'can_logs' not found (attempt {attempt+1}/{TABLE_RETRIES})... retrying in 5s")
        time.sleep(5)
else:
    print("❌ Table 'can_logs' never became available.")
    exit(1)

# The directory containing CSV files is mounted at /app/can_logs in the container
DATA_DIR = "/app/can_logs"
if not os.path.exists(DATA_DIR):
    print(f"⚠️ Data directory {DATA_DIR} not found!")
    exit(1)

# List all CSV files in the directory
csv_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".csv")]

for file in csv_files:
    file_path = os.path.join(DATA_DIR, file)
    # Derive vehicle_type from the filename (e.g., "RZR2.csv" becomes "RZR2")
    vehicle_type = os.path.splitext(file)[0]
    df = pd.read_csv(file_path)
    for _, row in df.iterrows():
        formatted_time = convert_time_format(row["Time"])
        if formatted_time is None:
            continue  # Skip rows with invalid time format
        cursor.execute(
            """
            INSERT INTO can_logs (log_time, variable, value, vehicle_type)
            VALUES (%s, %s, %s, %s)
            """,
            (
                formatted_time,
                row["Variable"],
                row["Value"],
                vehicle_type
            )
        )

conn.commit()
cursor.close()
conn.close()
print("✅ CAN data successfully loaded into PostgreSQL")
