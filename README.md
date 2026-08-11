# Request Management System 🚀

A modern full-stack web application for request tracking, inventory allocation, and administrative reporting, built with Node.js, Express, TypeScript, MongoDB Atlas, React, and Vite.

---

## 📁 Repository Structure

```text
request-management-system/
├── backend/                  # Node.js + Express + TypeScript + Mongoose API
│   ├── src/
│   │   ├── config/           # Environment and App Configuration
│   │   ├── controllers/      # Route Controllers (Auth, Requests, Inventory, Reports)
│   │   ├── db/               # MongoDB Connection & Seeding Logic
│   │   ├── middleware/       # JWT Auth & Security Middleware
│   │   ├── models/           # Mongoose Schemas & Models
│   │   ├── routes/           # API Endpoints (/api/auth, /api/requests, etc.)
│   │   ├── services/         # Email & External Integrations
│   │   └── types.ts          # Backend Shared Types
│   ├── .env                  # Environment Variables & MONGODB_URI
│   ├── package.json          # Backend Dependencies
│   ├── server.ts             # Express Server Entry Point (Port 5000)
│   └── tsconfig.json
│
├── frontend/                 # Vite + React + TypeScript + Tailwind CSS UI
│   ├── src/
│   │   ├── assets/           # Application Images & Visual Assets
│   │   ├── components/       # UI Modules & Dashboards
│   │   ├── App.tsx           # Main Application State & Views
│   │   ├── index.css         # Tailwind & Modern Styling System
│   │   ├── main.tsx          # React DOM Mount
│   │   └── types.ts          # Frontend Shared Types
│   ├── .env                  # Frontend Environment Variables
│   ├── index.html            # HTML Shell
│   ├── package.json          # Frontend Dependencies
│   ├── tsconfig.json
│   └── vite.config.ts        # Vite Dev Server & API Proxy (Port 5173 -> 5000)
│
├── .gitignore
└── README.md
```

---

## 🚀 How to Run the Project locally

### 1. Run the Backend API Server
Open a terminal in the `backend/` folder:

```powershell
cd backend
npm.cmd install        # (or npm install)
npm.cmd run dev        # Starts Express server on http://localhost:5000
```

### 2. Run the Frontend UI App
Open a separate terminal in the `frontend/` folder:

```powershell
cd frontend
npm.cmd install        # (or npm install)
npm.cmd run dev        # Starts Vite dev server on http://localhost:5173
```

- Open **[http://localhost:5173](http://localhost:5173)** in your browser!
- The frontend automatically proxies `/api/*` requests to `http://localhost:5000`.

---

## 🍃 MongoDB Atlas Configuration

The backend is connected to your **MongoDB Atlas Cluster** (`request_management_db`).
Environment settings are stored in `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://gayandisanayaka15_db_user:ndOXbPiivFU11nYJ@cluster0.mt5fjjj.mongodb.net/request_management_db?retryWrites=true&w=majority
```

---

## 🐙 How to Push to GitHub

To push this organized repository to your GitHub account:

1. **Initialize Git Repository** *(if not initialized)*:
   ```bash
   git init
   git branch -M main
   ```

2. **Add Remote Repository**:
   ```bash
   git remote add origin https://github.com/your-username/your-repository-name.git
   ```

3. **Stage, Commit, and Push**:
   ```bash
   git add .
   git commit -m "Organized project into backend and frontend with MongoDB Atlas connection"
   git push -u origin main
   ```
