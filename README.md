# Complaint Portal

A college grievance portal with a React + Vite frontend and a Node.js + Express API designed to connect to Supabase.

## Repository structure

- `Complaint Portal/` — existing React + Vite frontend
- `backend/` — Express API, Supabase server client, authentication middleware, complaint routes, and admin routes

## Backend setup

1. Install Node.js (LTS).
2. Open a terminal in the `backend` folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env` and fill in your Supabase project URL and server-side service-role key.
5. Start the development server:

   ```bash
   npm run dev
   ```

6. Check `http://localhost:5000/api/health`.

**Security:** Never commit `backend/.env` or expose the Supabase service-role key in frontend code. The key bypasses Row Level Security and must remain server-only.

## API starter routes

- `GET /api/health` — health check
- `GET /api/auth/me` — current authenticated user
- `GET /api/complaints` — current user's complaints
- `POST /api/complaints` — create a complaint
- `GET /api/admin/complaints` — admin-only complaint listing
- `PATCH /api/admin/complaints/:id/status` — admin-only status update

Protected routes expect `Authorization: Bearer <Supabase access token>`.

## Database expectations

The starter API expects a `profiles` table with `id` and `role` columns, and a `complaints` table with at least `id`, `user_id`, `title`, `description`, `category`, `status`, and `created_at`. Create and verify the schema in Supabase before using these endpoints. Adjust field names and status values to match the actual database schema.

Before production, add request validation, rate limiting, audit/status history, tests, and production deployment configuration. The frontend is not yet wired to these API endpoints.
