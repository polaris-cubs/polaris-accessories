# Polaris Connected Accessories
Analyzing Accessory Usage Data for Polaris Dealers and Customers

## 🔗 Repository
[Link to repository](https://github.com/polaris-cubs/polaris-accessories)

## 🛠 Set-up Steps

### Docker (Recommended)
Use the provided docker-compose.yml to spin up services at once:
```bash
docker-compose up --build
```

### Backend (Go API)
1. Navigate to the backend directory:
   ```bash
   cd polaris-accessories/polaris-backend
   ```
2. Run the Go backend:
   ```bash
   go run main.go
   ```
3. Ensure SQLite database `data/polaris.db` is accessible locally.

### Frontend (React)
1. Navigate to the frontend directory:
   ```bash
   cd polaris-accessories/polaris-dashboard
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the frontend on local dev server:
   ```bash
   npm run dev
   ```

## 🧠 Project Overview
This project enables Polaris stakeholders to gain insights into how accessories are being used in the field.

It consists of:
- A **Go backend** that handles API endpoints and interacts with SQLite
- A **React frontend** that provides a user interface for data visualization and interaction
- A **SQLite database** that stores accessory usage data

The dashboard displays:
- Time-series data on accessory usage
- Filterable tables grouped by vehicle/customer
- Insights on usage frequency, patterns, and anomalies

## ✅ What Works
- Clean UI with filtering and grouping of accessory events
- API endpoints successfully serve filtered data from SQLite
- Docker setup for backend/frontend works in local environments
- Chart.js integration for dynamic graphs
- Organized data folder with preloaded sample data

## ❌ What Doesn’t Work
- SQLite is not containerized — must run outside Docker
- No real-time streaming or syncing with live Polaris data
- No authentication or role-based access control
- UI doesn’t yet support mobile responsiveness
- Serverless deployment (e.g. Vercel Functions) is not fully wired in
- No AWS or cloud technologies for data storage or processing

## 🚧 What could be next
- Add authentication via Vercel + Kinde/Auth0
- Containerize SQLite or migrate to a lightweight cloud DB (like PlanetScale or Supabase)
- Implement real-time streaming using WebSockets or serverless hooks
- Add test coverage and CI pipeline (e.g., GitHub Actions)
- Refactor frontend components using reusable layout and hook patterns
- Improve accessibility and mobile UI
- Migrate and scale to AWS or GCP for production deployment

