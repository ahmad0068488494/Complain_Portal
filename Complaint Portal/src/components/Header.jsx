import { useState } from "react";
import "./Header.css";

const nav = [["Home", "home"], ["About", "about"]];
const serviceLinks = [
  ["Raise a Complaint", "login", "✎"],
  ["Grievance Categories", "services", "▦"],
];

export default function Header({ active, session, profile, onSignOut }) {
  const [servicesOpen, setServicesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
              <button type="button" className={`services-toggle ${servicesOpen || active === "services" || active === "faqs" ? "active" : ""}`}
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
            <a className={active === "faqs" ? "active" : ""} href="#faqs" onClick={closeMobileMenu}>Help</a>
            {session && <a className={active === "track" ? "active" : ""} href="#track" onClick={closeMobileMenu}>Track Complaint</a>}
            <div className="mobile-auth-links">
              {!session ? (
                <>
                  <a className="btn btn-ghost" href="#login" onClick={closeMobileMenu}>Login</a>
                  <a className="btn btn-primary" href="#register" onClick={closeMobileMenu}>Register</a>
                </>
              ) : (
                <>
                  {profile?.role === "student" && <a className="mobile-dashboard-link" href="#dashboard" onClick={closeMobileMenu}>My Dashboard</a>}
                  <button type="button" className="mobile-signout-link" onClick={() => { closeMobileMenu(); onSignOut?.(); }}>Sign out</button>
                </>
              )}
            </div>
          </nav>
          <div className="header-actions">
            {session && profile?.role === "student" && <a className="btn btn-primary dashboard-header-link" href="#dashboard">My Dashboard</a>}
            {!session && (
              <div className="desktop-auth-links">
                <a className="btn btn-ghost" href="#login">Login</a>
                <a className="btn btn-primary" href="#register">Register</a>
              </div>
            )}
            {session && (
              <div className={`profile-menu ${profileOpen ? "is-open" : ""}`}>
                <button className="profile-trigger desktop-profile-trigger" type="button" aria-label="Open account menu"
                  aria-expanded={profileOpen} aria-haspopup="true"
                  onClick={() => setProfileOpen((open) => !open)}
                  onKeyDown={(event) => { if (event.key === "Escape") setProfileOpen(false); }}>
                  <svg viewBox="0 0 128 128" role="img" aria-label="Profile"><circle cx="64" cy="64" r="62" fill="#062f60"/><circle cx="64" cy="43" r="22" fill="#fff"/><path d="M20 112c2-25 19-39 44-39s42 14 44 39c-12 10-27 15-44 15s-32-5-44-15Z" fill="#fff"/></svg>
                </button>
                {profileOpen && (
                  <div className="profile-dropdown" role="menu">
                    <a href="#dashboard" role="menuitem" onClick={() => setProfileOpen(false)}>My Dashboard</a>
                    <button type="button" role="menuitem" onClick={() => { setProfileOpen(false); onSignOut?.(); }}>Sign out</button>
                  </div>
                )}
              </div>
            )}
            <button className={`mobile-menu-trigger ${mobileMenuOpen ? "is-open" : ""}`} type="button"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen} aria-controls="mobile-primary-navigation"
              onClick={() => { setMobileMenuOpen((open) => !open); setServicesOpen(false); }}>
              <span></span><span></span><span></span>
            </button>
          </div>
        </>
      )}
    </header>
  );
}
