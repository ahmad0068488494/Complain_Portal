const features = [
  ["✎", "Easy to Report", "Submit your concern in a few simple steps."],
  ["⌕", "Track Progress", "Stay informed about your complaint status."],
  ["✓", "Fair & Transparent", "Clear updates support accountability."],
  ["♧", "A Better Campus", "Help build a safer, supportive community."],
];
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">STUDENT-CENTRED GRIEVANCE REDRESSAL</span>
          <h1>
            Your Voice Matters.
            <br />
            <em>Report. Track. Resolve.</em>
          </h1>
          <p>
            A simple and transparent way to raise concerns and get them resolved
            at your college.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#register">
              Raise a Complaint →
            </a>
            <a className="btn btn-ghost" href="#track">
              Track Complaint
            </a>
          </div>
          <small>✓ One portal. Clear updates. A better campus.</small>
        </div>
        <div className="hero-label">Campus community · Open communication</div>
      </section>
      <section className="features section">
        <div className="section-title">
          <span className="eyebrow">HOW IT HELPS</span>
          <h2>A better way to be heard</h2>
          <p>
            Raise concerns with confidence and follow progress without
            guesswork.
          </p>
        </div>
        <div className="feature-grid">
          {features.map(([icon, title, text], i) => (
            <article className="feature-card" key={title}>
              <span className={"feature-icon feature-" + i}>{icon}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="home-cta">
        <div>
          <h2>Let’s make your campus better, together.</h2>
          <p>
            Start a complaint or check the progress of one you have already
            submitted.
          </p>
        </div>
        <a className="btn btn-primary" href="#register">
          Get Started →
        </a>
      </section>
    </>
  );
}
