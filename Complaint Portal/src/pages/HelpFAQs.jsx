const faqs = [
  ["How do I raise a complaint?", "Choose Raise a Complaint from Services or use the button on the home page. Sign in or register, then provide the complaint details and submit the form."],
  ["How can I track a complaint?", "Open Track Complaint from the navigation bar and enter the complaint reference details requested on that page."],
  ["Which grievance category should I choose?", "Select the category that best matches your concern, such as Academic Issues, Infrastructure & Facilities, Faculty & Staff, Hostel, Food & Canteen, Safety & Security, Fees & Administration, Transportation, or Other Issues."],
  ["What if my issue does not fit any category?", "Choose Other Issues and describe the concern clearly so it can be reviewed by the appropriate team."],
  ["Can I submit supporting information?", "Include clear and relevant details in the complaint form. If the form provides an attachment option, add evidence that helps explain the issue."],
  ["What happens after I submit a complaint?", "Keep your complaint reference safe and use the Track Complaint page to check progress and updates."]
];

export default function HelpFAQs() {
  return (
    <>
      <section className="page-hero">
        <span className="eyebrow">SUPPORT CENTRE</span>
        <h1>Help & FAQs</h1>
        <p>Find guidance for raising a complaint, choosing a category, and tracking progress through the college complaint portal.</p>
      </section>
      <section className="section services">
        <div className="section-title">
          <span className="eyebrow">NEED A HAND?</span>
          <h2>Frequently asked questions</h2>
          <p>Quick answers to common questions about using the portal.</p>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details className="faq-item" key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
        <div className="faq-actions">
          <a className="btn btn-primary" href="#register">Raise a Complaint →</a>
          <a className="btn btn-ghost faq-secondary" href="#track">Track Complaint</a>
        </div>
      </section>
    </>
  );
}
