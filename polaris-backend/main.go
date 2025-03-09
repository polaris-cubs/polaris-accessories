package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/lib/pq"
)

// Global DB connection
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
	if err = db.Ping(); err != nil {
		log.Fatal("Error connecting to database:", err)
	}
	fmt.Println("✅ Connected to PostgreSQL")
}

// corsMiddleware adds CORS headers to each HTTP response.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow any origin for development (change "*" to your specific domain for production)
		w.Header().Set("Access-Control-Allow-Origin", "*")
		// Specify allowed methods
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		// Specify allowed headers
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		// For preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Message is a sample response structure.
type Message struct {
	Message string `json:"message"`
}

// messageHandler returns a simple JSON response.
func messageHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	resp := Message{Message: "Hello from the Go backend!"}
	json.NewEncoder(w).Encode(resp)
}

// Example: getDataHandler queries the database and returns sample data.
func getDataHandler(w http.ResponseWriter, r *http.Request) {
	// Example query: Adjust this query to suit your actual schema and data
	rows, err := db.Query("SELECT id, log_time, variable, value, vehicle_type FROM can_logs LIMIT 10")
	if err != nil {
		http.Error(w, "Database query error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type LogEntry struct {
		ID          int    `json:"id"`
		LogTime     string `json:"log_time"`
		Variable    string `json:"variable"`
		Value       string `json:"value"`
		VehicleType string `json:"vehicle_type"`
	}

	var entries []LogEntry
	for rows.Next() {
		var entry LogEntry
		if err := rows.Scan(&entry.ID, &entry.LogTime, &entry.Variable, &entry.Value, &entry.VehicleType); err != nil {
			http.Error(w, "Row scan error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		entries = append(entries, entry)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entries)
}

func main() {
	// Connect to the database
	initDB()
	defer db.Close()

	// Create a new ServeMux and attach handlers
	mux := http.NewServeMux()
	mux.HandleFunc("/", messageHandler)
	mux.HandleFunc("/api/data", getDataHandler) // Example API endpoint

	// Wrap the mux with CORS middleware
	handler := corsMiddleware(mux)

	// Determine the port from environment variables (default to 8080)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 Go server is running at http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
