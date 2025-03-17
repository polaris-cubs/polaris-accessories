package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var db *sql.DB

// initDB establishes a connection to PostgreSQL using DATABASE_URL.
func initDB() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}
	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Error opening database:", err)
	}
	// Set connection parameters (adjust as needed)
	db.SetConnMaxLifetime(time.Minute * 3)
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(10)
	if err = db.Ping(); err != nil {
		log.Fatal("Error connecting to database:", err)
	}
	fmt.Println("✅ Connected to PostgreSQL")
}

// corsMiddleware adds CORS headers for development.
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

// Simple message structure.
type Message struct {
	Message string `json:"message"`
}

func messageHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	resp := Message{Message: "Hello from the Go backend!"}
	json.NewEncoder(w).Encode(resp)
}

// getUsSummary returns state-level aggregates (rides and distinct vehicles),
// with optional filtering by state, vehicle_id, customer_id, and vehicle (brand).
func getUsSummary(w http.ResponseWriter, r *http.Request) {
	// Optional filters (vehicle_id, customer_id)
	vehicleIDFilter := r.URL.Query().Get("vehicle_id")
	customerIDFilter := r.URL.Query().Get("customer_id")
	var params []interface{}
	paramIdx := 1

	// CTE: All states from a static list.
	allStatesCTE := `
		WITH all_states AS (
			SELECT * FROM (VALUES
				('Alabama'),
				('Alaska'),
				('Arizona'),
				('Arkansas'),
				('California'),
				('Colorado'),
				('Connecticut'),
				('Delaware'),
				('District of Columbia'),
				('Florida'),
				('Georgia'),
				('Hawaii'),
				('Idaho'),
				('Illinois'),
				('Indiana'),
				('Iowa'),
				('Kansas'),
				('Kentucky'),
				('Louisiana'),
				('Maine'),
				('Maryland'),
				('Massachusetts'),
				('Michigan'),
				('Minnesota'),
				('Mississippi'),
				('Missouri'),
				('Montana'),
				('Nebraska'),
				('Nevada'),
				('New Hampshire'),
				('New Jersey'),
				('New Mexico'),
				('New York'),
				('North Carolina'),
				('North Dakota'),
				('Ohio'),
				('Oklahoma'),
				('Oregon'),
				('Pennsylvania'),
				('Rhode Island'),
				('South Carolina'),
				('South Dakota'),
				('Tennessee'),
				('Texas'),
				('Utah'),
				('Vermont'),
				('Virginia'),
				('Washington'),
				('West Virginia'),
				('Wisconsin'),
				('Wyoming')
			) AS t(state)
		)
	`

	// CTE: Dynamic list of all vehicle brands from dim_vehicle.
	allBrandsCTE := `
		, all_brands AS (
			SELECT DISTINCT brand FROM dim_vehicle ORDER BY brand
		)
	`

	// CTE: Overall ride aggregates per state.
	rideAggCTE := `
		, rideAgg AS (
			SELECT c.state, 
			       COUNT(*) AS rides, 
			       COUNT(DISTINCT r.vehicle_id) AS vehicles,
			       COUNT(DISTINCT r.customer_id) AS customers
			FROM fact_vehicle_ride r
			JOIN dim_customer c ON r.customer_id = c.customer_id
			WHERE 1=1
	`
	if vehicleIDFilter != "" {
		rideAggCTE += fmt.Sprintf(" AND r.vehicle_id = $%d", paramIdx)
		params = append(params, vehicleIDFilter)
		paramIdx++
	}
	if customerIDFilter != "" {
		rideAggCTE += fmt.Sprintf(" AND r.customer_id = $%d", paramIdx)
		params = append(params, customerIDFilter)
		paramIdx++
	}
	rideAggCTE += " GROUP BY c.state)"

	// CTE: Brand-level aggregates per state.
	brandAggCTE := `
		, brandAgg AS (
			SELECT c.state, v.brand,
			       COUNT(*) AS rides,
			       COUNT(DISTINCT r.vehicle_id) AS vehicles
			FROM fact_vehicle_ride r
			JOIN dim_customer c ON r.customer_id = c.customer_id
			JOIN dim_vehicle v ON r.vehicle_id = v.vehicle_id
			WHERE 1=1
	`
	if vehicleIDFilter != "" {
		brandAggCTE += fmt.Sprintf(" AND r.vehicle_id = $%d", paramIdx)
		params = append(params, vehicleIDFilter)
		paramIdx++
	}
	if customerIDFilter != "" {
		brandAggCTE += fmt.Sprintf(" AND r.customer_id = $%d", paramIdx)
		params = append(params, customerIDFilter)
		paramIdx++
	}
	brandAggCTE += " GROUP BY c.state, v.brand)"

	// CTE: For each state, cross join with all brands and LEFT JOIN with brandAgg.
	brandDataCTE := `
		, brandData AS (
		    SELECT s.state,
		           json_agg(
		             json_build_object(
		               'brand', ab.brand,
		               'rides', COALESCE(ba.rides, 0),
		               'vehicles', COALESCE(ba.vehicles, 0),
		               'avg_rides', CASE WHEN COALESCE(ba.vehicles, 0) = 0 THEN 0 ELSE ROUND(COALESCE(ba.rides, 0)::numeric / COALESCE(ba.vehicles, 0), 2) END
		             ) ORDER BY ab.brand
		           ) AS brand_averages
		    FROM all_states s
		    CROSS JOIN all_brands ab
		    LEFT JOIN ( SELECT * FROM ( ` + brandAggCTE + ` ) AS raw ) ba
		      ON s.state = ba.state AND ab.brand = ba.brand
		    GROUP BY s.state
		)
	`

	// Outer query: join all_states with rideAgg and brandData.
	finalQuery := allStatesCTE + allBrandsCTE + rideAggCTE + brandAggCTE + brandDataCTE + `
		SELECT a.state, 
		       COALESCE(r.rides, 0) AS rides, 
		       COALESCE(r.vehicles, 0) AS vehicles,
		       COALESCE(r.customers, 0) AS customers,
		       CASE WHEN COALESCE(r.vehicles, 0) = 0 THEN 0 ELSE ROUND(r.rides::numeric / r.vehicles, 2) END AS avg_rides_per_vehicle,
		       COALESCE(b.brand_averages, '[]'::json) AS brand_averages
		FROM all_states a
		LEFT JOIN rideAgg r ON a.state = r.state
		LEFT JOIN brandData b ON a.state = b.state
		ORDER BY a.state;
	`

	rows, err := db.Query(finalQuery, params...)
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
	var summaries []StateSummary
	for rows.Next() {
		var s StateSummary
		if err := rows.Scan(&s.State, &s.Rides, &s.Vehicles, &s.Customers, &s.AvgRidesPerVehicle, &s.BrandAverages); err != nil {
			http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		summaries = append(summaries, s)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summaries)
}

// getRideDetails returns detailed ride records with optional filters.
func getRideDetails(w http.ResponseWriter, r *http.Request) {
	stateFilter := r.URL.Query().Get("state")
	vehicleIDFilter := r.URL.Query().Get("vehicle_id")
	customerIDFilter := r.URL.Query().Get("customer_id")
	vehicleFilter := r.URL.Query().Get("vehicle")

	query := `
		SELECT r.ride_id, r.event_timestamp, c.state, v.brand, r.customer_id, r.vehicle_id
		FROM fact_vehicle_ride r
		JOIN dim_customer c ON r.customer_id = c.customer_id
		JOIN dim_vehicle v ON r.vehicle_id = v.vehicle_id
		WHERE 1=1
	`
	var params []interface{}
	paramIdx := 1
	if stateFilter != "" {
		query += fmt.Sprintf(" AND c.state = $%d", paramIdx)
		params = append(params, stateFilter)
		paramIdx++
	}
	if vehicleIDFilter != "" {
		query += fmt.Sprintf(" AND r.vehicle_id = $%d", paramIdx)
		params = append(params, vehicleIDFilter)
		paramIdx++
	}
	if customerIDFilter != "" {
		query += fmt.Sprintf(" AND r.customer_id = $%d", paramIdx)
		params = append(params, customerIDFilter)
		paramIdx++
	}
	if vehicleFilter != "" {
		query += fmt.Sprintf(" AND v.brand = $%d", paramIdx)
		params = append(params, vehicleFilter)
		paramIdx++
	}
	query += " ORDER BY r.event_timestamp DESC;"

	rows, err := db.Query(query, params...)
	if err != nil {
		http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type RideDetail struct {
		RideID         int64  `json:"ride_id"`
		EventTimestamp string `json:"event_timestamp"`
		State          string `json:"state"`
		Brand          string `json:"brand"`
		CustomerID     int64  `json:"customer_id"`
		VehicleID      string `json:"vehicle_id"`
	}
	var rides []RideDetail
	for rows.Next() {
		var rd RideDetail
		if err := rows.Scan(&rd.RideID, &rd.EventTimestamp, &rd.State, &rd.Brand, &rd.CustomerID, &rd.VehicleID); err != nil {
			http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		rides = append(rides, rd)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rides)
}

// getAccessorySummary returns aggregated accessory usage with filters.
func getAccessorySummary(w http.ResponseWriter, r *http.Request) {
	stateFilter := r.URL.Query().Get("state")
	vehicleIDFilter := r.URL.Query().Get("vehicle_id")
	customerIDFilter := r.URL.Query().Get("customer_id")
	vehicleFilter := r.URL.Query().Get("vehicle")

	// Join with dim_vehicle if filtering by brand.
	query := `
		SELECT c.state, p.property_name, COUNT(*) AS usage_count
		FROM fact_ride_property rp
		JOIN fact_vehicle_ride r ON rp.ride_id = r.ride_id
		JOIN dim_customer c ON r.customer_id = c.customer_id
		JOIN dim_property p ON rp.property_id = p.property_id
		JOIN dim_vehicle v ON r.vehicle_id = v.vehicle_id
		WHERE 1=1
	`
	var params []interface{}
	paramIdx := 1
	if stateFilter != "" {
		query += fmt.Sprintf(" AND c.state = $%d", paramIdx)
		params = append(params, stateFilter)
		paramIdx++
	}
	if vehicleIDFilter != "" {
		query += fmt.Sprintf(" AND r.vehicle_id = $%d", paramIdx)
		params = append(params, vehicleIDFilter)
		paramIdx++
	}
	if customerIDFilter != "" {
		query += fmt.Sprintf(" AND r.customer_id = $%d", paramIdx)
		params = append(params, customerIDFilter)
		paramIdx++
	}
	if vehicleFilter != "" {
		query += fmt.Sprintf(" AND v.brand = $%d", paramIdx)
		params = append(params, vehicleFilter)
		paramIdx++
	}
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
	var summaries []AccessorySummary
	for rows.Next() {
		var a AccessorySummary
		if err := rows.Scan(&a.State, &a.PropertyName, &a.UsageCount); err != nil {
			http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		summaries = append(summaries, a)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summaries)
}

// getVehicleSummary returns ride counts and distinct vehicles grouped by vehicle brand.
func getVehicleSummary(w http.ResponseWriter, r *http.Request) {
	stateFilter := r.URL.Query().Get("state")
	vehicleIDFilter := r.URL.Query().Get("vehicle_id")
	customerIDFilter := r.URL.Query().Get("customer_id")
	vehicleFilter := r.URL.Query().Get("vehicle")

	query := `
		SELECT v.brand, COUNT(r.ride_id) AS rides, COUNT(DISTINCT r.vehicle_id) AS vehicles
		FROM fact_vehicle_ride r
		JOIN dim_vehicle v ON r.vehicle_id = v.vehicle_id
		JOIN dim_customer c ON r.customer_id = c.customer_id
		WHERE 1=1
	`
	var params []interface{}
	paramIdx := 1
	if stateFilter != "" {
		query += fmt.Sprintf(" AND c.state = $%d", paramIdx)
		params = append(params, stateFilter)
		paramIdx++
	}
	if vehicleIDFilter != "" {
		query += fmt.Sprintf(" AND r.vehicle_id = $%d", paramIdx)
		params = append(params, vehicleIDFilter)
		paramIdx++
	}
	if customerIDFilter != "" {
		query += fmt.Sprintf(" AND r.customer_id = $%d", paramIdx)
		params = append(params, customerIDFilter)
		paramIdx++
	}
	if vehicleFilter != "" {
		query += fmt.Sprintf(" AND v.brand = $%d", paramIdx)
		params = append(params, vehicleFilter)
		paramIdx++
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
	var summaries []VehicleSummary
	for rows.Next() {
		var vs VehicleSummary
		if err := rows.Scan(&vs.Brand, &vs.Rides, &vs.Vehicles); err != nil {
			http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		summaries = append(summaries, vs)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summaries)
}

// getTimeSeries returns daily ride counts.
func getTimeSeries(w http.ResponseWriter, r *http.Request) {
	stateFilter := r.URL.Query().Get("state")
	vehicleIDFilter := r.URL.Query().Get("vehicle_id")
	customerIDFilter := r.URL.Query().Get("customer_id")
	vehicleFilter := r.URL.Query().Get("vehicle")

	query := `
		SELECT DATE(r.event_timestamp) AS ride_date, COUNT(*) AS rides
		FROM fact_vehicle_ride r
		JOIN dim_customer c ON r.customer_id = c.customer_id
		JOIN dim_vehicle v ON r.vehicle_id = v.vehicle_id
		WHERE 1=1
	`
	var params []interface{}
	paramIdx := 1
	if stateFilter != "" {
		query += fmt.Sprintf(" AND c.state = $%d", paramIdx)
		params = append(params, stateFilter)
		paramIdx++
	}
	if vehicleIDFilter != "" {
		query += fmt.Sprintf(" AND r.vehicle_id = $%d", paramIdx)
		params = append(params, vehicleIDFilter)
		paramIdx++
	}
	if customerIDFilter != "" {
		query += fmt.Sprintf(" AND r.customer_id = $%d", paramIdx)
		params = append(params, customerIDFilter)
		paramIdx++
	}
	if vehicleFilter != "" {
		query += fmt.Sprintf(" AND v.brand = $%d", paramIdx)
		params = append(params, vehicleFilter)
		paramIdx++
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
	var ts []TimeSeriesData
	for rows.Next() {
		var t TimeSeriesData
		if err := rows.Scan(&t.RideDate, &t.Rides); err != nil {
			http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		ts = append(ts, t)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ts)
}

func getStateDetail(w http.ResponseWriter, r *http.Request) {
	// This endpoint is meant to provide detailed accessory usage for a specific state.
	// State is required; additional filters are optional.
	stateFilter := r.URL.Query().Get("state")
	if stateFilter == "" {
		http.Error(w, "Missing state parameter", http.StatusBadRequest)
		return
	}
	vehicleIDFilter := r.URL.Query().Get("vehicle_id")
	customerIDFilter := r.URL.Query().Get("customer_id")
	vehicleFilter := r.URL.Query().Get("vehicle")

	query := `
		SELECT c.state, p.property_name, COUNT(*) AS usage_count
		FROM fact_ride_property rp
		JOIN fact_vehicle_ride r ON rp.ride_id = r.ride_id
		JOIN dim_customer c ON r.customer_id = c.customer_id
		JOIN dim_property p ON rp.property_id = p.property_id
		JOIN dim_vehicle v ON r.vehicle_id = v.vehicle_id
		WHERE c.state = $1
	`
	params := []interface{}{stateFilter}
	paramIdx := 2
	if vehicleIDFilter != "" {
		query += fmt.Sprintf(" AND r.vehicle_id = $%d", paramIdx)
		params = append(params, vehicleIDFilter)
		paramIdx++
	}
	if customerIDFilter != "" {
		query += fmt.Sprintf(" AND r.customer_id = $%d", paramIdx)
		params = append(params, customerIDFilter)
		paramIdx++
	}
	if vehicleFilter != "" {
		query += fmt.Sprintf(" AND v.brand = $%d", paramIdx)
		params = append(params, vehicleFilter)
		paramIdx++
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
	var details []StateDetail
	for rows.Next() {
		var d StateDetail
		if err := rows.Scan(&d.State, &d.PropertyName, &d.UsageCount); err != nil {
			http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		details = append(details, d)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(details)
}

// getUniqueStates returns a unique list of states from dim_customer.
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
		var state string
		if err := rows.Scan(&state); err != nil {
			http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		states = append(states, state)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(states)
}

// getUniqueVehicleIDs returns a unique list of vehicle IDs from fact_vehicle_ride.
func getUniqueVehicleIDs(w http.ResponseWriter, r *http.Request) {
	query := `SELECT DISTINCT vehicle_id FROM fact_vehicle_ride ORDER BY vehicle_id;`
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var vehicleIDs []string
	for rows.Next() {
		var vid string
		if err := rows.Scan(&vid); err != nil {
			http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		vehicleIDs = append(vehicleIDs, vid)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(vehicleIDs)
}

// getUniqueCustomerIDs returns a unique list of customer IDs from fact_vehicle_ride.
func getUniqueCustomerIDs(w http.ResponseWriter, r *http.Request) {
	query := `SELECT DISTINCT customer_id FROM fact_vehicle_ride ORDER BY customer_id;`
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var customerIDs []string
	for rows.Next() {
		var cid string
		if err := rows.Scan(&cid); err != nil {
			http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		customerIDs = append(customerIDs, cid)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(customerIDs)
}

// getUniqueVehicles returns a unique list of vehicle brands from dim_vehicle.
func getUniqueVehicles(w http.ResponseWriter, r *http.Request) {
	query := `SELECT DISTINCT brand FROM dim_vehicle ORDER BY brand;`
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var vehicles []string
	for rows.Next() {
		var brand string
		if err := rows.Scan(&brand); err != nil {
			http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		vehicles = append(vehicles, brand)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(vehicles)
}

func getSnowplowUsagePerRide(w http.ResponseWriter, r *http.Request) {
    stateFilter := r.URL.Query().Get("state")
    vehicleIDFilter := r.URL.Query().Get("vehicle_id")
    customerIDFilter := r.URL.Query().Get("customer_id")
    vehicleFilter := r.URL.Query().Get("vehicle")
    startDate := r.URL.Query().Get("start")
    endDate := r.URL.Query().Get("end")

    query := `
        SELECT DATE(r.event_timestamp) AS ride_date, COUNT(DISTINCT r.ride_id) AS uses
        FROM fact_vehicle_ride r
        JOIN fact_ride_property rp ON r.ride_id = rp.ride_id
        JOIN dim_customer c ON r.customer_id = c.customer_id
        JOIN dim_vehicle v ON r.vehicle_id = v.vehicle_id
        WHERE rp.property_id = 6 AND LOWER(rp.value) = 'down'
    `
    var params []interface{}
    paramIdx := 1

    if stateFilter != "" {
        query += fmt.Sprintf(" AND c.state = $%d", paramIdx)
        params = append(params, stateFilter)
        paramIdx++
    }
    if vehicleIDFilter != "" {
        query += fmt.Sprintf(" AND r.vehicle_id = $%d", paramIdx)
        params = append(params, vehicleIDFilter)
        paramIdx++
    }
    if customerIDFilter != "" {
        query += fmt.Sprintf(" AND r.customer_id = $%d", paramIdx)
        params = append(params, customerIDFilter)
        paramIdx++
    }
    if vehicleFilter != "" {
        query += fmt.Sprintf(" AND v.brand = $%d", paramIdx)
        params = append(params, vehicleFilter)
        paramIdx++
    }
    if startDate != "" {
        query += fmt.Sprintf(" AND r.event_timestamp >= $%d", paramIdx)
        params = append(params, startDate)
        paramIdx++
    }
    if endDate != "" {
        query += fmt.Sprintf(" AND r.event_timestamp <= $%d", paramIdx)
        params = append(params, endDate)
        paramIdx++
    }

    query += " GROUP BY ride_date ORDER BY ride_date;"

    rows, err := db.Query(query, params...)
    if err != nil {
        http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    type SnowplowUsage struct {
        RideDate string  `json:"ride_date"`
        Uses     int     `json:"uses"`
    }
    var usage []SnowplowUsage
    for rows.Next() {
        var s SnowplowUsage
        if err := rows.Scan(&s.RideDate, &s.Uses); err != nil {
            http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
            return
        }
        usage = append(usage, s)
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(usage)
}

func main() {
	initDB()
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("/", messageHandler)

	// Endpoints for data summaries:
	mux.HandleFunc("/api/us-summary", getUsSummary)
	mux.HandleFunc("/api/rides", getRideDetails)
	mux.HandleFunc("/api/accessory-summary", getAccessorySummary)
	mux.HandleFunc("/api/vehicle-summary", getVehicleSummary)
	mux.HandleFunc("/api/time-series", getTimeSeries)
	mux.HandleFunc("/api/state-detail", getStateDetail)

	// Endpoints for unique lists:
	mux.HandleFunc("/api/state", getUniqueStates)
	mux.HandleFunc("/api/vehicle-id", getUniqueVehicleIDs)
	mux.HandleFunc("/api/customer-id", getUniqueCustomerIDs)
	mux.HandleFunc("/api/vehicle", getUniqueVehicles)

	// Endpoints for accessory usage:
	mux.HandleFunc("/api/snowplow-usage", getSnowplowUsagePerRide)

	handler := corsMiddleware(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 Go server is running at http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
