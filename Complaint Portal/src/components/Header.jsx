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
              <a key={id} className={active === id ? "active" : ""} href={"#" + id} onClick={() => setServicesOpen(false)}>{label}</a>
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
            {session && <a className={active === "track" ? "active" : ""} href="#track" onClick={() => setServicesOpen(false)}>Track Complaint</a>}
          </nav>
          <div className="header-actions">
            {session && profile?.role === "student" && <a className="btn btn-primary dashboard-header-link" href="#dashboard">My Dashboard</a>}
            <div className={`profile-menu ${profileOpen ? "is-open" : ""}`}>
              <button className="profile-trigger" type="button" aria-label="Open account menu"
                aria-expanded={profileOpen} aria-haspopup="true"
                onClick={() => setProfileOpen((open) => !open)}
                onKeyDown={(event) => { if (event.key === "Escape") setProfileOpen(false); }}>
                <img src="data:image/png;base64,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" alt="" width="24" height="24" />
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
