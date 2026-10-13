import { useState } from "react";
export default function TrackComplaint() {
  const [id, setId] = useState(""),
    [error, setError] = useState(""),
    [searched, setSearched] = useState(false);
  function submit(e) {
    e.preventDefault();
    setSearched(false);
    if (!id.trim()) {
      setError("Enter your complaint reference ID.");
      return;
    }
    setError("");
    setSearched(true);
  }
  return (
    <>
      <section className="page-hero">
        <span className="eyebrow">COMPLAINT TRACKING</span>
        <h1>Know where things stand.</h1>
        <p>Use your reference ID to begin checking complaint progress.</p>
      </section>
      <section className="track-wrap">
        <form className="track-card" onSubmit={submit}>
          <span className="feature-icon">⌕</span>
          <h2>Track your complaint</h2>
          <p>
            Enter the reference ID you received after submitting your complaint.
          </p>
          <label htmlFor="complaint-id">Complaint reference ID</label>
          <input
            id="complaint-id"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setError("");
              setSearched(false);
            }}
            placeholder="e.g. CP-2026-00123"
          />
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit">
            Check status →
          </button>
          {searched && (
            <p className="info">
              The tracking form is ready; live status will be available once the
              backend API is connected.
            </p>
          )}
          <small>
            For privacy, detailed complaint history should require sign-in.
          </small>
        </form>
      </section>
    </>
  );
}
