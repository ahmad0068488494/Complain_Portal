import { useState } from "react";

const statusLabels = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};
const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

export default function TrackComplaint() {
  const [id, setId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [complaint, setComplaint] = useState(null);
  const [searched, setSearched] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setComplaint(null);
    setSearched(false);
    const referenceId = id.trim().toUpperCase();
    if (!referenceId) {
      setError("Enter your complaint reference ID.");
      return;
    }
    if (!supabase) {
      setError(
        "Live tracking is not configured. Connect Supabase to enable complaint tracking.",
      );
      return;
    }
    setLoading(true);
    try {
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
      const response = await fetch(
        `${apiBaseUrl}/api/public/track/${encodeURIComponent(referenceId)}`,
        { headers: { Accept: "application/json" } },
      );
      const payload = await response.json().catch(() => ({}));
      setSearched(true);
      if (!response.ok) {
        setError(
          response.status === 404
            ? "No complaint was found for that ID. Check the ID and try again."
            : payload.error || "Unable to check this complaint right now. Please try again.",
        );
        return;
      }
      setComplaint(payload.complaint);
    } catch {
      setSearched(true);
      setError("Unable to reach the Complaint Portal API. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="page-hero">
        <span className="eyebrow">COMPLAINT TRACKING</span>
        <h1>Know where things stand.</h1>
        <p>Use your complaint reference ID to check the latest status.</p>
      </section>
      <section className="track-wrap">
        <form className="track-card" onSubmit={submit}>
          <span className="feature-icon">⌕</span>
          <h2>Track your complaint</h2>
          <p>Enter the reference ID shown after you submit your complaint.</p>
          <label htmlFor="complaint-id">Complaint reference ID</label>
          <input
            id="complaint-id"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setError("");
              setComplaint(null);
              setSearched(false);
            }}
            placeholder="e.g. CP-2026-0123456789ABCDEF0123456789ABCDEF"
            autoComplete="off"
            required
          />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Checking…" : "Check status →"}
          </button>
          {complaint && (
            <section className="track-result" aria-live="polite">
              <div className="track-result-heading">
                <div>
                  <small>COMPLAINT REFERENCE</small>
                  <h3>{complaint.reference_id}</h3>
                </div>
                <span className={"status-pill status-" + complaint.status}>
                  {statusLabels[complaint.status] || complaint.status}
                </span>
              </div>
              <h3>{complaint.title}</h3>
              <p>
                <strong>Category:</strong> {complaint.category || "—"}
              </p>
              <p>
                <strong>Submitted:</strong> {dateLabel(complaint.created_at)}
              </p>
              {complaint.updated_at && (
                <p>
                  <strong>Last updated:</strong>{" "}
                  {dateLabel(complaint.updated_at)}
                </p>
              )}
              {complaint.admin_remarks && (
                <p className="track-admin-update">
                  <strong>Latest update:</strong> {complaint.admin_remarks}
                </p>
              )}
            </section>
          )}
          <small>
            Only basic tracking details are shown here. Keep your reference ID
            private.
          </small>
        </form>
      </section>
    </>
  );
}
