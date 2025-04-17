package main

import (
    "database/sql"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "strconv"

    _ "github.com/mattn/go-sqlite3"
)

// Global DB handle
var db *sql.DB

// initDB opens the SQLite database at SQLITE_DB_PATH
func initDB() {
    dbPath := os.Getenv("SQLITE_DB_PATH")
    if dbPath == "" {
        log.Fatal("SQLITE_DB_PATH environment variable is not set")
    }

    var err error
    db, err = sql.Open("sqlite3", dbPath)
    if err != nil {
        log.Fatal("Error opening SQLite DB:", err)
    }
    if err = db.Ping(); err != nil {
        log.Fatal("Error connecting to SQLite:", err)
    }
    fmt.Println("✅ Connected to SQLite:", dbPath)
}

// Simple CORS middleware for local dev
func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }
        next.ServeHTTP(w, r)
    })
}

// A simple test endpoint
type Message struct {
    Message string `json:"message"`
}
func messageHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(Message{Message: "Hello from the Go (SQLite) backend!"})
}

// -----------------------------------------------------------------------------
// US-Summary Endpoint (unchanged: no reference to fact_ride_property)
// -----------------------------------------------------------------------------
func getUsSummary(w http.ResponseWriter, r *http.Request) {
    // No filters. Always show everything.

    query := `
WITH all_states(state) AS (
  VALUES
    ('Alabama'),('Alaska'),('Arizona'),('Arkansas'),('California'),('Colorado'),
    ('Connecticut'),('Delaware'),('District of Columbia'),('Florida'),('Georgia'),
    ('Hawaii'),('Idaho'),('Illinois'),('Indiana'),('Iowa'),('Kansas'),('Kentucky'),
    ('Louisiana'),('Maine'),('Maryland'),('Massachusetts'),('Michigan'),('Minnesota'),
    ('Mississippi'),('Missouri'),('Montana'),('Nebraska'),('Nevada'),('New Hampshire'),
    ('New Jersey'),('New Mexico'),('New York'),('North Carolina'),('North Dakota'),
    ('Ohio'),('Oklahoma'),('Oregon'),('Pennsylvania'),('Rhode Island'),('South Carolina'),
    ('South Dakota'),('Tennessee'),('Texas'),('Utah'),('Vermont'),('Virginia'),
    ('Washington'),('West Virginia'),('Wisconsin'),('Wyoming')
),
all_brands AS (
  SELECT DISTINCT brand FROM dim_vehicle ORDER BY brand
),
rideAgg AS (
  SELECT c.state AS st,
         COUNT(*) AS rides,
         COUNT(DISTINCT r.vehicle_id) AS vehicles,
         COUNT(DISTINCT r.customer_id) AS customers
  FROM fact_vehicle_ride r
  JOIN dim_customer c ON r.customer_id = c.customer_id
  GROUP BY c.state
),
brandAgg AS (
  SELECT c.state AS st,
         v.brand,
         COUNT(*) AS rides,
         COUNT(DISTINCT r.vehicle_id) AS vehicles
  FROM fact_vehicle_ride r
  JOIN dim_customer c ON r.customer_id = c.customer_id
  JOIN dim_vehicle v ON r.vehicle_id = v.vehicle_id
  GROUP BY c.state, v.brand
),
brandData AS (
  SELECT s.state,
         json_group_array(
           json_object(
             'brand',    ab.brand,
             'rides',    coalesce(ba.rides, 0),
             'vehicles', coalesce(ba.vehicles, 0),
             'avg_rides',
               CASE WHEN coalesce(ba.vehicles, 0)=0
                    THEN 0
                    ELSE round(cast(ba.rides as real) / ba.vehicles, 2)
               END
           )
         ) AS brand_averages
  FROM all_states s
  CROSS JOIN all_brands ab
  LEFT JOIN brandAgg ba
    ON s.state = ba.st AND ab.brand = ba.brand
  GROUP BY s.state
)
SELECT
  a.state,
  coalesce(r.rides, 0) AS rides,
  coalesce(r.vehicles, 0) AS vehicles,
  coalesce(r.customers, 0) AS customers,
  CASE WHEN coalesce(r.vehicles,0)=0
       THEN 0
       ELSE round(cast(r.rides as real)/ r.vehicles, 2)
  END AS avg_rides_per_vehicle,
  coalesce(b.brand_averages, '[]') AS brand_averages
FROM all_states a
LEFT JOIN rideAgg r ON a.state = r.st
LEFT JOIN brandData b ON a.state = b.state
ORDER BY a.state;
`

    rows, err := db.Query(query)
    if err != nil {
        http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    type StateSummary struct {
        State              string          `json:"state"`
        Rides              int             `json:"rides"`
        Vehicles           int             `json:"vehicles"`
        Customers          int             `json:"customers"`
        AvgRidesPerVehicle float64         `json:"avg_rides_per_vehicle"`
        BrandAverages      json.RawMessage `json:"brand_averages"`
    }

    var results []StateSummary
    for rows.Next() {
        var (
            st       string
            rides    int
            veh      int
            cust     int
            avg      float64
            brandStr string
        )
        if err := rows.Scan(&st, &rides, &veh, &cust, &avg, &brandStr); err != nil {
            http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
            return
        }

        row := StateSummary{
            State:              st,
            Rides:              rides,
            Vehicles:           veh,
            Customers:          cust,
            AvgRidesPerVehicle: avg,
            BrandAverages:      json.RawMessage(brandStr),
        }
        results = append(results, row)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(results)
}

// -----------------------------------------------------------------------------
// Ride Details (unchanged from your snippet – references fact_vehicle_ride only)
// -----------------------------------------------------------------------------

func getRideDetails(w http.ResponseWriter, r *http.Request) {
    // 1) Parse optional filters
    state := r.URL.Query().Get("state")
    vehicleID := r.URL.Query().Get("vehicle_id")
    customerID := r.URL.Query().Get("customer_id")
    vehicle := r.URL.Query().Get("vehicle")

    // 2) Parse optional pagination
    pageStr := r.URL.Query().Get("page")
    pageSizeStr := r.URL.Query().Get("page_size")

    page := 1
    pageSize := 50

    if pageStr != "" {
        if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
            page = p
        }
    }
    if pageSizeStr != "" {
        if ps, err := strconv.Atoi(pageSizeStr); err == nil && ps > 0 {
            pageSize = ps
        }
    }
    offset := (page - 1) * pageSize

    // 3) Build the base query + filters
    query := `
SELECT r.ride_id, r.event_timestamp, c.state, v.brand, r.customer_id, r.vehicle_id
FROM fact_vehicle_ride r
JOIN dim_customer c ON r.customer_id = c.customer_id
JOIN dim_vehicle v ON r.vehicle_id = v.vehicle_id
WHERE 1=1
`
    var params []interface{}

    if state != "" {
        query += " AND c.state = ?"
        params = append(params, state)
    }
    if vehicleID != "" {
        query += " AND r.vehicle_id = ?"
        params = append(params, vehicleID)
    }
    if customerID != "" {
        query += " AND r.customer_id = ?"
        params = append(params, customerID)
    }
    if vehicle != "" {
        query += " AND v.brand = ?"
        params = append(params, vehicle)
    }

    // 4) Add ORDER BY, LIMIT, OFFSET
    query += " ORDER BY r.event_timestamp DESC LIMIT ? OFFSET ?"
    params = append(params, pageSize, offset)

    // 5) Execute
    rows, err := db.Query(query, params...)
    if err != nil {
        http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    // 6) Scan rows
    type RideDetail struct {
        RideID         int64  `json:"ride_id"`
        EventTimestamp string `json:"event_timestamp"`
        State          string `json:"state"`
        Brand          string `json:"brand"`
        CustomerID     int64  `json:"customer_id"`
        VehicleID      string `json:"vehicle_id"`
    }
    var details []RideDetail

    for rows.Next() {
        var rd RideDetail
        if err := rows.Scan(&rd.RideID, &rd.EventTimestamp, &rd.State, &rd.Brand,
            &rd.CustomerID, &rd.VehicleID); err != nil {
            http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
            return
        }
        details = append(details, rd)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(details)
}

// -----------------------------------------------------------------------------
// Accessory Summary – NEW JSON-based logic
// -----------------------------------------------------------------------------

func getAccessorySummary(w http.ResponseWriter, r *http.Request) {
    state := r.URL.Query().Get("state")
    vehicleID := r.URL.Query().Get("vehicle_id")
    customerID := r.URL.Query().Get("customer_id")
    vehicle := r.URL.Query().Get("vehicle")

    // We'll parse each row's "property_values" JSON array
    // using "json_each()" on fact_vehicle_ride.
    query := `
SELECT c.state,
       p.property_name,
       COUNT(*) AS usage_count
FROM fact_vehicle_ride r
JOIN dim_customer c ON r.customer_id = c.customer_id
JOIN dim_vehicle v ON r.vehicle_id = v.vehicle_id
-- This is how we "unpack" the JSON array stored in r.property_values
JOIN json_each(r.property_values) j
-- Then we link the JSON "id" to dim_property.property_id
JOIN dim_property p
  ON p.property_id = CAST(json_extract(j.value, '$.id') AS INTEGER)
WHERE 1=1
`
    var params []interface{}

    if state != "" {
        query += " AND c.state = ?"
        params = append(params, state)
    }
    if vehicleID != "" {
        query += " AND r.vehicle_id = ?"
        params = append(params, vehicleID)
    }
    if customerID != "" {
        query += " AND r.customer_id = ?"
        params = append(params, customerID)
    }
    if vehicle != "" {
        query += " AND v.brand = ?"
        params = append(params, vehicle)
    }

    // Group by state & property_name
    query += " GROUP BY c.state, p.property_name ORDER BY c.state, p.property_name;"

    rows, err := db.Query(query, params...)
    if err != nil {
        http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    type AccessorySummary struct {
        State        string `json:"state"`
        PropertyName string `json:"property_name"`
        UsageCount   int    `json:"usage_count"`
    }
    var results []AccessorySummary

    for rows.Next() {
        var a AccessorySummary
        if err := rows.Scan(&a.State, &a.PropertyName, &a.UsageCount); err != nil {
            http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
            return
        }
        results = append(results, a)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(results)
}

// -----------------------------------------------------------------------------
// Vehicle Summary (unchanged from your snippet – references fact_vehicle_ride only)
// -----------------------------------------------------------------------------

func getVehicleSummary(w http.ResponseWriter, r *http.Request) {
    state := r.URL.Query().Get("state")
    vehicleID := r.URL.Query().Get("vehicle_id")
    customerID := r.URL.Query().Get("customer_id")
    vehicle := r.URL.Query().Get("vehicle")

    query := `
SELECT v.brand, COUNT(r.ride_id) AS rides, COUNT(DISTINCT r.vehicle_id) AS vehicles
FROM fact_vehicle_ride r
JOIN dim_vehicle v ON r.vehicle_id = v.vehicle_id
JOIN dim_customer c ON r.customer_id = c.customer_id
WHERE 1=1
`
    var params []interface{}

    if state != "" {
        query += " AND c.state = ?"
        params = append(params, state)
    }
    if vehicleID != "" {
        query += " AND r.vehicle_id = ?"
        params = append(params, vehicleID)
    }
    if customerID != "" {
        query += " AND r.customer_id = ?"
        params = append(params, customerID)
    }
    if vehicle != "" {
        query += " AND v.brand = ?"
        params = append(params, vehicle)
    }
    query += " GROUP BY v.brand ORDER BY rides DESC;"

    rows, err := db.Query(query, params...)
    if err != nil {
        http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    type VehicleSummary struct {
        Brand    string `json:"brand"`
        Rides    int    `json:"rides"`
        Vehicles int    `json:"vehicles"`
    }
    var results []VehicleSummary

    for rows.Next() {
        var vs VehicleSummary
        if err := rows.Scan(&vs.Brand, &vs.Rides, &vs.Vehicles); err != nil {
            http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
            return
        }
        results = append(results, vs)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(results)
}

// -----------------------------------------------------------------------------
// Time Series (unchanged – references fact_vehicle_ride only)
// -----------------------------------------------------------------------------

func getTimeSeries(w http.ResponseWriter, r *http.Request) {
    state := r.URL.Query().Get("state")
    vehicleID := r.URL.Query().Get("vehicle_id")
    customerID := r.URL.Query().Get("customer_id")
    vehicle := r.URL.Query().Get("vehicle")

    query := `
SELECT DATE(r.event_timestamp) AS ride_date, COUNT(*) AS rides
FROM fact_vehicle_ride r
JOIN dim_customer c ON r.customer_id = c.customer_id
JOIN dim_vehicle v ON r.vehicle_id = v.vehicle_id
WHERE 1=1
`
    var params []interface{}

    if state != "" {
        query += " AND c.state = ?"
        params = append(params, state)
    }
    if vehicleID != "" {
        query += " AND r.vehicle_id = ?"
        params = append(params, vehicleID)
    }
    if customerID != "" {
        query += " AND r.customer_id = ?"
        params = append(params, customerID)
    }
    if vehicle != "" {
        query += " AND v.brand = ?"
        params = append(params, vehicle)
    }
    query += " GROUP BY ride_date ORDER BY ride_date;"

    rows, err := db.Query(query, params...)
    if err != nil {
        http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    type TimeSeriesData struct {
        RideDate string `json:"ride_date"`
        Rides    int    `json:"rides"`
    }
    var results []TimeSeriesData

    for rows.Next() {
        var ts TimeSeriesData
        if err := rows.Scan(&ts.RideDate, &ts.Rides); err != nil {
            http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
            return
        }
        results = append(results, ts)
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(results)
}

// -----------------------------------------------------------------------------
// State Detail – NEW JSON-based logic
// -----------------------------------------------------------------------------

func getStateDetail(w http.ResponseWriter, r *http.Request) {
    // This endpoint is meant to provide detailed accessory usage for a specific state.
    // We no longer have "fact_ride_property", so we parse property_values JSON via json_each().
    state := r.URL.Query().Get("state")
    if state == "" {
        http.Error(w, "Missing state parameter", http.StatusBadRequest)
        return
    }
    vehicleID := r.URL.Query().Get("vehicle_id")
    customerID := r.URL.Query().Get("customer_id")
    vehicle := r.URL.Query().Get("vehicle")

    query := `
SELECT c.state,
       p.property_name,
       COUNT(*) AS usage_count
FROM fact_vehicle_ride r
JOIN dim_customer c ON r.customer_id = c.customer_id
JOIN dim_vehicle v ON r.vehicle_id = v.vehicle_id
JOIN json_each(r.property_values) j
JOIN dim_property p
  ON p.property_id = CAST(json_extract(j.value, '$.id') AS INTEGER)
WHERE c.state = ?
`
    params := []interface{}{state}

    if vehicleID != "" {
        query += " AND r.vehicle_id = ?"
        params = append(params, vehicleID)
    }
    if customerID != "" {
        query += " AND r.customer_id = ?"
        params = append(params, customerID)
    }
    if vehicle != "" {
        query += " AND v.brand = ?"
        params = append(params, vehicle)
    }
    query += " GROUP BY c.state, p.property_name ORDER BY p.property_name;"

    rows, err := db.Query(query, params...)
    if err != nil {
        http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    type StateDetail struct {
        State        string `json:"state"`
        PropertyName string `json:"property_name"`
        UsageCount   int    `json:"usage_count"`
    }
    var results []StateDetail

    for rows.Next() {
        var d StateDetail
        if err := rows.Scan(&d.State, &d.PropertyName, &d.UsageCount); err != nil {
            http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
            return
        }
        results = append(results, d)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(results)
}

// -----------------------------------------------------------------------------
// Unique States, Vehicle IDs, Customer IDs, Vehicles (same, no fact_ride_property references)
// -----------------------------------------------------------------------------

func getUniqueStates(w http.ResponseWriter, r *http.Request) {
    query := `SELECT DISTINCT state FROM dim_customer ORDER BY state;`
    rows, err := db.Query(query)
    if err != nil {
        http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var states []string
    for rows.Next() {
        var s string
        if err := rows.Scan(&s); err != nil {
            http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
            return
        }
        states = append(states, s)
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(states)
}

func getUniqueVehicleIDs(w http.ResponseWriter, r *http.Request) {
    query := `SELECT DISTINCT vehicle_id FROM fact_vehicle_ride ORDER BY vehicle_id;`
    rows, err := db.Query(query)
    if err != nil {
        http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var vids []string
    for rows.Next() {
        var v string
        if err := rows.Scan(&v); err != nil {
            http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
            return
        }
        vids = append(vids, v)
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(vids)
}

func getUniqueCustomerIDs(w http.ResponseWriter, r *http.Request) {
    query := `SELECT DISTINCT customer_id FROM fact_vehicle_ride ORDER BY customer_id;`
    rows, err := db.Query(query)
    if err != nil {
        http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var cids []string
    for rows.Next() {
        var c string
        if err := rows.Scan(&c); err != nil {
            http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
            return
        }
        cids = append(cids, c)
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(cids)
}

func getUniqueVehicles(w http.ResponseWriter, r *http.Request) {
    query := `SELECT DISTINCT brand FROM dim_vehicle ORDER BY brand;`
    rows, err := db.Query(query)
    if err != nil {
        http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var brands []string
    for rows.Next() {
        var b string
        if err := rows.Scan(&b); err != nil {
            http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
            return
        }
        brands = append(brands, b)
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(brands)
}

// -----------------------------------------------------------------------------
// getSnowplowUsagePerRide – now uses JSON1 (property_id=6 → "down")
// -----------------------------------------------------------------------------

func getSnowplowUsagePerRide(w http.ResponseWriter, r *http.Request) {
    state := r.URL.Query().Get("state")
    vehicleID := r.URL.Query().Get("vehicle_id")
    customerID := r.URL.Query().Get("customer_id")
    vehicle := r.URL.Query().Get("vehicle")
    start := r.URL.Query().Get("start")
    end := r.URL.Query().Get("end")

    // We look for: property_id=6 and lower(value)='down'
    // in the JSON array stored in r.property_values
    query := `
SELECT DATE(r.event_timestamp) AS ride_date,
       COUNT(DISTINCT r.ride_id) AS uses
FROM fact_vehicle_ride r
JOIN json_each(r.property_values) j
JOIN dim_customer c ON r.customer_id = c.customer_id
JOIN dim_vehicle v ON r.vehicle_id = v.vehicle_id
WHERE CAST(json_extract(j.value, '$.id') AS INTEGER) = 6
  AND LOWER(json_extract(j.value, '$.value')) = 'down'
`
    var params []interface{}

    if state != "" {
        query += " AND c.state = ?"
        params = append(params, state)
    }
    if vehicleID != "" {
        query += " AND r.vehicle_id = ?"
        params = append(params, vehicleID)
    }
    if customerID != "" {
        query += " AND r.customer_id = ?"
        params = append(params, customerID)
    }
    if vehicle != "" {
        query += " AND v.brand = ?"
        params = append(params, vehicle)
    }
    if start != "" {
        query += " AND r.event_timestamp >= ?"
        params = append(params, start)
    }
    if end != "" {
        query += " AND r.event_timestamp <= ?"
        params = append(params, end)
    }
    query += `
GROUP BY ride_date
ORDER BY ride_date;
`

    rows, err := db.Query(query, params...)
    if err != nil {
        http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    type SnowplowUsage struct {
        RideDate string `json:"ride_date"`
        Uses     int    `json:"uses"`
    }
    var results []SnowplowUsage

    for rows.Next() {
        var su SnowplowUsage
        if err := rows.Scan(&su.RideDate, &su.Uses); err != nil {
            http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
            return
        }
        results = append(results, su)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(results)
}

func getSnowplowUsage(w http.ResponseWriter, r *http.Request) {
    state := r.URL.Query().Get("state")
    vehicleID := r.URL.Query().Get("vehicle_id")
    customerID := r.URL.Query().Get("customer_id")
    vehicle := r.URL.Query().Get("vehicle")

    // We'll parse each row's "property_values" JSON array
    // using "json_each()" on fact_vehicle_ride.
    query := `
SELECT STRFTIME('%Y %m', r.event_timestamp) AS month,
       COUNT(DISTINCT r.customer_id) AS num_users,
       COUNT(DISTINCT r.ride_id) AS num_uses
FROM fact_vehicle_ride r
JOIN dim_customer c ON r.customer_id = c.customer_id
JOIN dim_vehicle v ON r.vehicle_id = v.vehicle_id
-- This is how we "unpack" the JSON array stored in r.property_values
JOIN json_each(r.property_values) j
-- Then we link the JSON "id" to dim_property.property_id
JOIN dim_property p
  ON p.property_id = CAST(json_extract(j.value, '$.id') AS INTEGER)
WHERE 1=1
`
    var params []interface{}

    if state != "" {
        query += " AND c.state = ?"
        params = append(params, state)
    }
    if vehicleID != "" {
        query += " AND r.vehicle_id = ?"
        params = append(params, vehicleID)
    }
    if customerID != "" {
        query += " AND r.customer_id = ?"
        params = append(params, customerID)
    }
    if vehicle != "" {
        query += " AND v.brand = ?"
        params = append(params, vehicle)
    }


    query+= " AND p.property_name = 'plow_state' AND r.property_values LIKE '%DOWN%'"

    // Group by month
    query += " GROUP BY month ORDER BY p.property_name;"

    rows, err := db.Query(query, params...)
    if err != nil {
        http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    type AccessorySummary struct {
        YearMonth    string `json:"month"`
        NumberUsers  int    `json:"num_users"`
        NumberUses   int    `json:"num_uses"`
    }
    var results []AccessorySummary

    for rows.Next() {
        var a AccessorySummary
        if err := rows.Scan(&a.YearMonth, &a.NumberUsers, &a.NumberUses); err != nil {
            http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
            return
        }
        results = append(results, a)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(results)
}


// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

func main() {
    initDB()
    defer db.Close()

    mux := http.NewServeMux()

    mux.HandleFunc("/", messageHandler)

    // Summaries
    mux.HandleFunc("/api/us-summary", getUsSummary)
    mux.HandleFunc("/api/rides", getRideDetails)
    mux.HandleFunc("/api/accessory-summary", getAccessorySummary)
    mux.HandleFunc("/api/vehicle-summary", getVehicleSummary)
    mux.HandleFunc("/api/time-series", getTimeSeries)
    mux.HandleFunc("/api/state-detail", getStateDetail)

    // Unique lists
    mux.HandleFunc("/api/state", getUniqueStates)
    mux.HandleFunc("/api/vehicle-id", getUniqueVehicleIDs)
    mux.HandleFunc("/api/customer-id", getUniqueCustomerIDs)
    mux.HandleFunc("/api/vehicle", getUniqueVehicles)

    // Accessory usage
    //mux.HandleFunc("/api/snowplow-usage", getSnowplowUsagePerRide)

    mux.HandleFunc("/api/snowplow-usage", getSnowplowUsage)

    handler := corsMiddleware(mux)

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    fmt.Printf("🚀 Go server is running at http://localhost:%s\n", port)
    log.Fatal(http.ListenAndServe(":"+port, handler))
}