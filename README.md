# Complaint Portal

A college complaint-management project using React + Vite for the frontend, Node.js + Express for the API, and Supabase Auth + PostgreSQL for authentication and data storage.

## Project structure

- `Complaint Portal/` — React + Vite frontend
- `backend/` — Express API and Supabase server-side client
- `backend/supabase/schema.sql` — database tables, signup profile trigger, and Row Level Security policies

## Requirements

- Node.js LTS (use a version supported by Vite 8; Node.js 20.19+ or 22.12+ is recommended)
- A Supabase project

## 1. Configure Supabase

Production Supabase project: `Complaint Portal Production` (`tnpitjbmrldctswebeeo`, Mumbai region). The schema in `backend/supabase/schema.sql` has already been applied and verified in this project.

1. Open the production project in Supabase Dashboard if you need to inspect its database.
2. In **Project Settings → API Keys**, copy the server-only secret/service-role key. The project URL is `https://tnpitjbmrldctswebeeo.supabase.co`.
4. Keep the service-role key only in `backend/.env`. Never put it in the React frontend or commit it to GitHub.

## 2. Start the backend

Open a terminal at the repository root:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env` and replace the placeholder values:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://tnpitjbmrldctswebeeo.supabase.co
SUPABASE_ANON_KEY=sb_publishable_iA6jKx8Fiz1vxgtZstEjww_52vNUhE-
SUPABASE_SERVICE_ROLE_KEY=YOUR_REAL_SERVER_ONLY_SECRET_KEY
```

Then run:

```powershell
npm run dev
```

Verify the API in your browser: http://localhost:5000/api/health

A healthy response contains `"status": "ok"`. The root URL http://localhost:5000 also returns a status response.

## 3. Start the frontend

Open a **second terminal** at the repository root:

```powershell
cd "Complaint Portal"
npm install
npm run dev
```

Open the local URL printed by Vite, usually http://localhost:5173. The Vite development server proxies `/api` requests to the backend on port 5000.

## Available API routes

- `GET /api/health` — API health check
- `GET /api/auth/me` — current authenticated user (requires a Supabase access token)
- `GET /api/complaints` — current user's complaints (requires authentication)
- `POST /api/complaints` — create a complaint (requires authentication)
- `GET /api/admin/complaints` — list complaints (requires an admin account)
- `PATCH /api/admin/complaints/:id/status` — update status (requires an admin account)

Protected routes expect `Authorization: Bearer <Supabase access token>`.

## Important current scope

The production Supabase database schema and local backend starter are in place. The existing login/register frontend is still UI-only and is **not yet connected to Supabase Auth**. Student/admin dashboards, account registration/login integration, complaint forms, and end-to-end tests are the next development steps. Do not treat the UI role selector as authorization; admin access must be granted in the database by a trusted project administrator.

## Security notes

- Never commit `backend/.env`.
- Never expose the Supabase service-role key in frontend code.
- Keep Row Level Security enabled on user data tables.
- For production, configure the real deployed frontend origin, input validation, rate limiting, logging, and deployment environment variables.
