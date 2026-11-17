const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function apiRequest(path, { session, method = "GET", body } = {}) {
  const token = session?.access_token;
  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const headers = { Authorization: `Bearer ${token}` };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error(
      "Unable to reach the Complaint Portal API. Make sure the backend server is running.",
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 502 || response.status === 504) {
      throw new Error(
        "The Complaint Portal backend is not responding. Start the backend server from the backend folder (npm run dev) and confirm it is listening on port 5000.",
      );
    }
    throw new Error(payload.error || `Request failed (${response.status}).`);
  }
  return payload;
}
