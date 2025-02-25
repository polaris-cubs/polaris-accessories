// backend/main.go
package main

import (
    "fmt"
    "net/http"
)

func messageHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "text/plain")
    fmt.Fprintln(w, "Hello from the Go backend!")
}

func main() {
    http.HandleFunc("/", messageHandler)

    port := "8080"
    fmt.Printf("Go server is running at http://localhost:%s\n", port)
    if err := http.ListenAndServe(":"+port, nil); err != nil {
        fmt.Println("Failed to start server:", err)
    }
}