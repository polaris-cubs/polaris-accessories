import psycopg2
import pandas as pd
import os

# Database connection
conn = psycopg2.connect(
    dbname="polaris",
    user="polaris_user",
    password="polaris_password",
    host="localhost",
    port="5432"
)
cursor = conn.cursor()

# Path to CAN data files
DATA_DIR = os.path.join(os.path.dirname(__file__), "../data/can_logs")

# List CSV files
csv_files = ["Ranger.csv", "RZR1.csv", "RZR2.csv"]

for file in csv_files:
    file_path = os.path.join(DATA_DIR, file)
    if not os.path.exists(file_path):
        print(f"⚠️ Skipping {file} (file not found)")
        continue

    df = pd.read_csv(file_path)
    vehicle_type = file.replace(".csv", "")  # Extract vehicle type from filename

    for _, row in df.iterrows():
        cursor.execute(
            """
            INSERT INTO can_data (time, vehicle_vin, variable, value, vehicle_type)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                row["Time"], 
                row["Value"] if "VIN" in row["Variable"] else None, 
                row["Variable"], 
                row["Value"], 
                vehicle_type
            )
        )

conn.commit()
cursor.close()
conn.close()
print("CAN data successfully loaded into PostgreSQL")
