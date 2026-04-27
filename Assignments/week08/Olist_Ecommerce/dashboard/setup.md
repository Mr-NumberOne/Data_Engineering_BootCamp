# Olist Analytics Dashboard Setup

This document provides step-by-step instructions to run the Olist E-commerce Data Warehouse Dashboard locally.

The dashboard consists of:
1. **Backend**: A FastAPI application that queries the PostgreSQL Data Warehouse.
2. **Frontend**: A React application (built with Vite) that displays interactive charts using Chart.js.

---

## 1. Prerequisites

Ensure you have the following installed on your system:
- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL (with the `olist_dwh` database fully populated by the ELT pipeline)

---

## 2. Start the FastAPI Backend

Open a terminal and navigate to the project root directory (`Olist_Ecommerce`).

1. **Navigate to the backend folder**:
   ```bash
   cd dashboard/backend
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the API Server**:
   ```bash
   uvicorn main:app --reload
   ```
   *The backend will now be running at `http://localhost:8000`. You can view the automatic API documentation at `http://localhost:8000/docs`.*

---

## 3. Start the React Frontend

Open a **new** terminal window and navigate to the project root directory (`Olist_Ecommerce`).

1. **Navigate to the frontend folder**:
   ```bash
   cd dashboard/frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite Development Server**:
   ```bash
   npm run dev
   ```
   *The frontend will now be running at `http://localhost:5173`. Open this URL in your web browser to view the dashboard.*

---

## Troubleshooting

- **CORS Errors**: Ensure the backend is running on `localhost:8000` and the frontend is running on `localhost:5173`. The backend is explicitly configured to allow requests from port `5173`.
- **Database Connection Errors**: Ensure your `.env` file exists in the root of the `Olist_Ecommerce` folder with the correct PostgreSQL credentials (`PG_USER`, `PG_PASSWORD`, etc.).
- **No Data Displayed**: Ensure you have successfully run the ELT pipeline (`python -m pipeline_postgres.run_pipeline`) to populate the data warehouse before starting the dashboard.
