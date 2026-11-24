import { useState } from "react";
import "./Header.css";

const nav = [["Home", "home"], ["About", "about"]];
const serviceLinks = [
  ["Raise a Complaint", "login", "✎"],
  ["Grievance Categories", "services", "▦"],
];

export default function Header({ active, session, profile, onSignOut }) {
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const isAdmin = Boolean(session && profile?.role === "admin");

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setServicesOpen(false);
  };

  return (
    <header className="site-header">
      <a className="brand" href={isAdmin ? "#dashboard" : "#home"} onClick={closeMobileMenu}>
        <span className="brand-icon" aria-hidden="true">▥</span>
        <span>Complaint Portal</span>
      </a>
      {isAdmin ? (
        <div className="header-actions admin-header-actions">
          <button className="btn btn-primary" type="button" onClick={onSignOut}>Sign out</button>
        </div>
      ) : (
        <>
          <nav id="mobile-primary-navigation" className={mobileMenuOpen ? "mobile-menu-open" : ""} aria-label="Main navigation">
            {nav.map(([label, id]) => (
              <a key={id} className={active === id && !(id === "about" && servicesOpen) ? "active" : ""} href={"#" + id} onClick={closeMobileMenu}>{label}</a>
            ))}
            <div className={`services-nav ${servicesOpen ? "is-open" : ""}`}>
              <button type="button" className={`services-toggle ${servicesOpen || active === "services" ? "active" : ""}`}
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
                        closeMobileMenu();
                      }}>
                      <span className="services-menu-icon" aria-hidden="true">{icon}</span><span>{label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
            <a className={active === "faqs" ? "active" : ""} href="#faqs" onClick={closeMobileMenu}>Help &amp; FAQs</a>
            {session && <a className={active === "track" ? "active" : ""} href="#track" onClick={closeMobileMenu}>Track Complaint</a>}
            <div className="mobile-auth-links">
              {!session ? (
                <>
                  <a className="btn btn-ghost" href="#login" onClick={closeMobileMenu}>Login</a>
                  <a className="btn btn-primary" href="#register" onClick={closeMobileMenu}>Register</a>
                </>
              ) : (
                <>
                  <a className="btn btn-ghost mobile-dashboard-btn" href="#dashboard" onClick={closeMobileMenu}>Dashboard</a>
                  <button className="btn btn-ghost mobile-logout-btn" type="button"
                    onClick={() => { closeMobileMenu(); onSignOut?.(); }}>Logout</button>
                </>
              )}
            </div>
          </nav>
          <div className="header-actions">
            {session && profile?.role !== "admin" && (
              <div className={`profile-menu ${profileMenuOpen ? "is-open" : ""}`}
                onMouseEnter={() => setProfileMenuOpen(true)}
                onMouseLeave={() => setProfileMenuOpen(false)}>
                <button type="button" className="profile-trigger" aria-label="Open profile menu" aria-expanded={profileMenuOpen}
                  onClick={() => setProfileMenuOpen((open) => !open)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.6" fill="#fff" /><path d="M4.5 20.5c.45-4.1 3.25-6.35 7.5-6.35s7.05 2.25 7.5 6.35H4.5Z" fill="#fff" /></svg>
                </button>
                <div className={`profile-dropdown ${profileMenuOpen ? "is-visible" : ""}`} role="menu" aria-hidden={!profileMenuOpen}>
                  <a href="#dashboard" tabIndex={profileMenuOpen ? 0 : -1} role="menuitem" onClick={() => setProfileMenuOpen(false)}>Dashboard</a>
                  <button type="button" tabIndex={profileMenuOpen ? 0 : -1} role="menuitem" onClick={() => { setProfileMenuOpen(false); onSignOut?.(); }}>Logout</button>
                </div>
              </div>
            )}
            {!session && (
              <div className="desktop-auth-links">
                <a className="btn btn-ghost" href="#login">Login</a>
                <a className="btn btn-primary" href="#register">Register</a>
              </div>
            )}
            <button className={`mobile-menu-trigger ${mobileMenuOpen ? "is-open" : ""}`} type="button"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen} aria-controls="mobile-primary-navigation"
              onClick={() => { setMobileMenuOpen((open) => !open); setServicesOpen(false); }}>
              <span className="menu-line"></span><span className="menu-line"></span><span className="menu-line"></span>
            </button>
          </div>
        </>
      )}
    </header>
  );
}
