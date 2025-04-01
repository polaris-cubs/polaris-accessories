.mode csv

-- Skip 1 line for column headers
.import --skip 1 csv/data_dim_customer.csv dim_customer
.import --skip 1 csv/data_dim_property.csv dim_property
.import --skip 1 csv/data_dim_vehicle.csv dim_vehicle
.import --skip 1 csv/data_fact_vehicle_ride.csv fact_vehicle_ride