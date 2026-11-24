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

## 2. Configure and start the frontend

Create `Complaint Portal/.env` using `Complaint Portal/.env.example` as a reference and set `VITE_SUPABASE_URL` plus `VITE_SUPABASE_PUBLISHABLE_KEY`. For a separately hosted production API, optionally set `VITE_API_BASE_URL` to the backend origin (for example, `https://api.example.com`); leave it empty for the local Vite proxy. Use only the publishable key in frontend variables; never put a service-role/secret key in the frontend. After changing environment variables, restart Vite.

Install the frontend dependency and start Vite:

```powershell
cd "Complaint Portal"
npm install
npm run dev
```

## 3. Start the backend

Open a terminal at the repository root:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env` and replace the placeholder values:

```env
PORT=5000
# Comma-separated exact frontend origins; no wildcard in production.
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://tnpitjbmrldctswebeeo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_REAL_SERVER_ONLY_SECRET_KEY
```

Then run:

```powershell
npm run dev
```

Verify the API in your browser: http://localhost:5000/api/health

A healthy response contains `"status": "ok"`. The root URL http://localhost:5000 also returns a status response.

## 4. Start the frontend (alternative local setup)

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

## Application data flow

- React uses Supabase Auth directly for sign-in/session management.
- Student and admin complaint CRUD operations go through the Express API (`/api`), which verifies the Supabase access token before querying PostgreSQL with the server-only service key.
- Student status refreshes continue to use Supabase Realtime; only the student's own complaint rows are subscribed to.
- The public Reference ID tracking page calls the Express API (`GET /api/public/track/:referenceId`); the server applies rate limiting and invokes the tracking RPC with its server-only service key.
- In local development, Vite proxies `/api` to `http://localhost:5000`. For separate production hosting, set `VITE_API_BASE_URL` to the backend origin and configure `FRONTEND_URL` on the backend to a comma-separated allowlist of exact frontend origins.

## Complaint reference and tracking

- Supabase PostgreSQL generates each complaint's `reference_id` automatically; frontend clients must never supply it for live inserts.
- Student and admin dashboards display and search the same database-generated Reference ID.
- Admin status updates are written to the shared `complaints` row and delivered to the student's dashboard through Supabase Realtime.
- The public tracking page uses the rate-limited Express endpoint to look up a Reference ID and returns only its basic progress fields and administrator remarks.
- New Reference IDs use 32 hexadecimal characters after the year prefix. Existing IDs are preserved; the API accepts the previous 8-character format during transition.
- The tracking RPC is executable only by the server-side `service_role`; anonymous and authenticated browser clients cannot invoke the SECURITY DEFINER function directly.
- Existing Reference IDs are retained when the schema upgrade is applied; only missing IDs are backfilled.
- Keep Row Level Security enabled. Admin authorization must be granted through the trusted `profiles.role` value, not a user-editable registration field.

The production project already has the `reference_id` column and tracking function. The schema file also includes idempotent upgrade statements for existing installations.

## Security notes

- Never commit `backend/.env`.
- Never expose the Supabase service-role key in frontend code.
- Keep Row Level Security enabled on user data tables.
- For production, configure the exact deployed frontend origin(s) in `FRONTEND_URL`, set `VITE_API_BASE_URL`, and keep all server secrets in the backend host's environment settings.
- The built-in rate limiter uses in-memory counters for the single-instance Render deployment. Use a shared store (for example Redis) before scaling the API to multiple instances.
