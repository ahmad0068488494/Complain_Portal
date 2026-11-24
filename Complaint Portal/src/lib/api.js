import { supabase } from "./supabase.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function getCurrentAccessToken(forceRefresh = false) {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check the frontend environment variables.");
  }

  if (forceRefresh) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session?.access_token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return data.session.access_token;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  // Refresh shortly before expiry so the backend receives a valid JWT.
  const expiresAt = data.session.expires_at || 0;
  if (expiresAt && expiresAt <= Math.floor(Date.now() / 1000) + 60) {
    return getCurrentAccessToken(true);
  }

  return data.session.access_token;
}

async function sendRequest(path, method, body, token) {
  if (!API_BASE_URL) {
    throw new Error("Backend API URL is not configured. The student dashboard needs the deployed Express API URL (VITE_API_BASE_URL) in Vercel.");
  }
  const headers = { Authorization: `Bearer ${token}` };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  return fetch(`${API_BASE_URL}/api${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

export async function apiRequest(path, { method = "GET", body } = {}) {
  let response;

  try {
    const token = await getCurrentAccessToken();
    response = await sendRequest(path, method, body, token);

    // A token can be revoked or invalidated between requests. Refresh once and retry.
    if (response.status === 401) {
      const refreshedToken = await getCurrentAccessToken(true);
      response = await sendRequest(path, method, body, refreshedToken);
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Unable to reach the Complaint Portal API. Make sure the backend server is running.",
      );
    }
    throw error;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 502 || response.status === 504) {
      throw new Error(
        "The Complaint Portal backend is not responding. Start the backend server from the backend folder (npm run dev) and confirm it is listening on port 5000.",
      );
    }
    if (response.status === 401) {
      throw new Error("Your session is no longer valid. Please sign in again.");
    }
    throw new Error(payload.error || `Request failed (${response.status}).`);
  }

  return payload;
}
