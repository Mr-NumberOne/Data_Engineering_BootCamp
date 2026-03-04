# Setup & Running the Project

This is a premium, full-stack project and task manager application built with a modern React UI and a Python FastAPI backend.

## Prerequisites
- **Python 3.9+**
- **Node.js 18+**
- **PostgreSQL**: A local instance running on port 5432 with user `postgres` and password `root`.

## Database Setup
You need a PostgreSQL database named `project-w3-db`. If it hasn't been created yet, you can create it via `psql` or a visual tool like pgAdmin:
```sql
CREATE DATABASE "project-w3-db";
```

## Backend Setup (FastAPI)
1. Navigate into the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create your local Environment Configuration:
   - Copy the provided `backend/.env.example` file and rename the new copy to `.env`.
   - Open `.env` and fill in the placeholders (such as your actual PostgreSQL password and database name). The system will dynamically create the tables upon launch.
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   > **Note**: The API runs on `http://localhost:8000`. 
   > You can view the automated Swagger UI documentation at `http://localhost:8000/docs`.

## Frontend Setup (React/Vite)
1. Open a new terminal and navigate into the frontend directory:
   ```bash
   cd frontend
   ```
2. Create your local Environment Configuration:
   - Copy the provided `frontend/.env.example` file and rename the new copy to `.env`.
   - The default `VITE_API_URL` is already set to `http://localhost:8000` assuming you are running the backend locally.
3. Install Node dependencies (already initialized):
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > **Note**: The frontend will run on `http://localhost:5173`. Make sure the backend is running so the frontend can retrieve data!

## Default Admin User
An admin user is automatically created upon first backend startup:
- **Email**: `admin@project.com`
- **Password**: `admin123`
