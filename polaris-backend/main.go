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
	stateFilter := r.URL.Query().Get("state")
	vehicleIDFilter := r.URL.Query().Get("vehicle_id")
	customerIDFilter := r.URL.Query().Get("customer_id")
	vehicleFilter := r.URL.Query().Get("vehicle") // brand

	query := `
		SELECT c.state, COUNT(*) AS rides, COUNT(DISTINCT r.vehicle_id) AS vehicles
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
	query += " GROUP BY c.state ORDER BY rides DESC;"

	rows, err := db.Query(query, params...)
	if err != nil {
		http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type StateSummary struct {
		State    string `json:"state"`
		Rides    int    `json:"rides"`
		Vehicles int    `json:"vehicles"`
	}
	var summaries []StateSummary
	for rows.Next() {
		var s StateSummary
		if err := rows.Scan(&s.State, &s.Rides, &s.Vehicles); err != nil {
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

func main() {
	initDB()
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("/", messageHandler)
	mux.HandleFunc("/api/us-summary", getUsSummary)
	mux.HandleFunc("/api/rides", getRideDetails)
	mux.HandleFunc("/api/accessory-summary", getAccessorySummary)
	mux.HandleFunc("/api/vehicle-summary", getVehicleSummary)
	mux.HandleFunc("/api/time-series", getTimeSeries)
	mux.HandleFunc("/api/state-detail", getStateDetail)

	handler := corsMiddleware(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 Go server is running at http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
