const items = [
  ["↗", "Easy Complaint Filing", "Report issues in a few clear steps."],
  ["◷", "Timely Resolution", "Help concerns reach the right team."],
  ["✓", "Transparent Process", "Follow progress with clear updates."],
  ["♧", "A Better Campus", "Build a supportive environment together."],
];
export default function About() {
  return (
    <>
      <section className="page-hero">
        <span className="eyebrow">ABOUT THE PORTAL</span>
        <h1>
          Better communication.
          <br />A better campus.
        </h1>
        <p>
          Building a transparent, responsive and student-centred complaint
          management system.
        </p>
      </section>
      <section className="about section">
        <div>
          <span className="eyebrow">OUR PURPOSE</span>
          <h2>About the College Complaint Portal</h2>
          <p>
            The College Complaint Portal provides a simple, transparent way for
            students to raise concerns, follow progress and receive updates. It
            creates a structured channel between students and the teams
            responsible for resolving issues.
          </p>
          <p>
            Our goal is to support a safer, more inclusive campus through clear
            communication, accountability and an organised grievance redressal
            process.
          </p>
        </div>
        <div className="campus-image">
          <strong>A community that listens.</strong>
        </div>
      </section>
      <section className="section features">
        <div className="section-title">
          <span className="eyebrow">WHAT WE AIM FOR</span>
          <h2>Our objectives</h2>
        </div>
        <div className="feature-grid">
          {items.map(([icon, title, text], i) => (
            <article className="feature-card" key={title}>
              <span className={"feature-icon feature-" + i}>{icon}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <blockquote className="quote">
        “Your voice matters. We are committed to listening, addressing and
        resolving concerns for a more inclusive college community.”
        <cite>— College Administration</cite>
      </blockquote>
    </>
  );
}
