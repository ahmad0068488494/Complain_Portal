import { useState } from "react";
import "./Header.css";

const nav = [["Home", "home"], ["About", "about"]];
const serviceLinks = [
  ["Raise a Complaint", "login", "✎"],
  ["Grievance Categories", "services", "▦"],
  ["Help & FAQs", "faqs", "?"],
];

export default function Header({ active, session, profile, onSignOut }) {
  const [servicesOpen, setServicesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const isAdmin = Boolean(session && profile?.role === "admin");

  return (
    <header className="site-header">
      <a className="brand" href={isAdmin ? "#dashboard" : "#home"}>
        <span className="brand-icon" aria-hidden="true">▥</span>
        <span>Complaint Portal</span>
      </a>
      {isAdmin ? (
        <div className="header-actions admin-header-actions">
          <button className="btn btn-primary" type="button" onClick={onSignOut}>Sign out</button>
        </div>
      ) : (
        <>
          <nav aria-label="Main navigation">
            {nav.map(([label, id]) => (
              <a key={id} className={active === id ? "active" : ""} href={"#" + id}>{label}</a>
            ))}
            <div className={`services-nav ${servicesOpen ? "is-open" : ""}`}>
              <button type="button" className={`services-toggle ${active === "services" || active === "faqs" ? "active" : ""}`}
                aria-expanded={servicesOpen} aria-haspopup="true"
                onClick={() => setServicesOpen((open) => !open)}
                onKeyDown={(event) => { if (event.key === "Escape") setServicesOpen(false); }}>
                Services
              </button>
              {servicesOpen && (
                <div className="services-dropdown" role="menu">
                  {serviceLinks.map(([label, id, icon]) => (
                    <a key={id} href={"#" + (label === "Raise a Complaint" ? (session ? "dashboard" : "login") : id)} role="menuitem"
                      onClick={() => {
                        if (label === "Raise a Complaint" && session) sessionStorage.setItem("focusComplaintForm", "true");
                        setServicesOpen(false);
                      }}>
                      <span className="services-menu-icon" aria-hidden="true">{icon}</span><span>{label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
            {session && <a className={active === "track" ? "active" : ""} href="#track">Track Complaint</a>}
          </nav>
          <div className="header-actions">
            {session && profile?.role === "student" && <a className="btn btn-primary dashboard-header-link" href="#dashboard">My Dashboard</a>}
            <div className={`profile-menu ${profileOpen ? "is-open" : ""}`}>
              <button className="profile-trigger" type="button" aria-label="Open account menu"
                aria-expanded={profileOpen} aria-haspopup="true"
                onClick={() => setProfileOpen((open) => !open)}
                onKeyDown={(event) => { if (event.key === "Escape") setProfileOpen(false); }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="8" r="4" /></svg>
              </button>
              {profileOpen && (
                <div className="profile-dropdown" role="menu">
                  {session ? (
                    <>
                      <a href="#dashboard" role="menuitem" onClick={() => setProfileOpen(false)}>My Dashboard</a>
                      <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); onSignOut?.(); }}>Sign out</button>
                    </>
                  ) : (
                    <>
                      <a href="#login" role="menuitem" onClick={() => setProfileOpen(false)}>Login</a>
                      <a href="#register" role="menuitem" onClick={() => setProfileOpen(false)}>Register</a>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
