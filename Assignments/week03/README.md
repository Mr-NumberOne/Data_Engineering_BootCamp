# Week 03: Project and Task Manager

Welcome to the Week 03 assignment! This week features a full-stack **Project and Task Manager** application designed to demonstrate the integration of a modern React frontend with a robust FastAPI backend.

## 🚀 Project Overview

The **Project and Task Manager** allows users to organize their work into projects and manage individual tasks within those projects. This application showcases premium UI design with glassmorphism effects and a performant asynchronous backend.

### Key Features
- **Project Management**: Create, view, edit, and delete projects with customizable icons and colors.
- **Task Tracking**: Add tasks to projects, update their status (TODO, IN PROGRESS, DONE), and manage them individually.
- **User Dashboard**: A central hub to view project statistics and recent activity.
- **Responsive Design**: A sleek, mobile-friendly interface built with React and Tailwind CSS principles.

## 🛠️ Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tixto.com/) (Python 3.9+)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: SQLAlchemy with Pydantic for data validation.
- **Authentication**: JWT-based security.

### Frontend
- **Framework**: [React](https://reactjs.org/) (Vite)
- **Styling**: Vanilla CSS with modern design tokens and [Lucide React](https://lucide.dev/) for iconography.
- **State Management**: React Hooks and Context API.
- **API Client**: Axios.

## 🏁 Getting Started

To get this project running on your local machine, follow the detailed instructions in the **[setup.md](./setup.md)** file.

### Quick Start Summary
1. **Database**: Create a PostgreSQL database named `project-w3-db`.
2. **Backend**:
   - Install dependencies: `pip install -r requirements.txt`
   - Run server: `uvicorn app.main:app --reload`
3. **Frontend**:
   - Install dependencies: `npm install`
   - Run dev server: `npm run dev`

## 📂 Directory Structure

- `/backend`: The FastAPI application code, models, and API routes.
- `/frontend`: The React application source code and assets.
- `create_db.sql`: Database initialization script.
- `setup.md`: Comprehensive setup and running guide.
