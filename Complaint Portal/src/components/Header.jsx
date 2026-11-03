import { useState } from "react";
import "./Header.css";

const nav = [
  ["Home", "home"],
  ["About", "about"],
  ["Track Complaint", "track"],
];

const serviceLinks = [
  ["Raise a Complaint", "dashboard", "✎"],
  ["Grievance Categories", "services", "▦"],
  ["Help & FAQs", "faqs", "?"],
];

export default function Header({ active, session }) {
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <header className="site-header">
      <a className="brand" href="#home">
        <span className="brand-icon" aria-hidden="true">▥</span>
        Complaint Portal
      </a>
      <nav aria-label="Main navigation">
        {nav.slice(0, 2).map(([label, id]) => (
          <a key={id} className={active === id ? "active" : ""} href={"#" + id}>
            {label}
          </a>
        ))}
        <div className={`services-nav ${servicesOpen ? "is-open" : ""}`}>
          <button
            type="button"
            className={`services-toggle ${active === "services" || active === "faqs" ? "active" : ""}`}
            aria-expanded={servicesOpen}
            aria-haspopup="true"
            onClick={() => setServicesOpen((open) => !open)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setServicesOpen(false);
            }}
          >
            Services <span className="services-chevron" aria-hidden="true">⌄</span>
          </button>
          {servicesOpen && (
            <div className="services-dropdown" role="menu">
              {serviceLinks.map(([label, id, icon]) => (
                <a
                  key={id}
                  href={"#" + id}
                  role="menuitem"
                  onClick={() => setServicesOpen(false)}
                >
                  <span className="services-menu-icon" aria-hidden="true">{icon}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
        <a className={active === "track" ? "active" : ""} href="#track">Track Complaint</a>
      </nav>
      <div className="header-actions">
        {session ? (
          <a className="btn btn-primary" href="#dashboard">My Dashboard</a>
        ) : (
          <>
            <a className="btn btn-ghost" href="#login">Login</a>
            <a className="btn btn-primary" href="#register">Register</a>
          </>
        )}
      </div>
    </header>
  );
}
