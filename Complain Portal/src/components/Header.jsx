import "./Header.css";
const nav = [
  ["Home", "home"],
  ["About", "about"],
  ["Services", "services"],
  ["Track Complaint", "track"],
];
export default function Header({ active }) {
  return (
    <header className="site-header">
      <a className="brand" href="#home">
        <span className="brand-icon">▥</span>College Complaint Portal
      </a>
      <nav>
        {nav.map(([label, id]) => (
          <a key={id} className={active === id ? "active" : ""} href={"#" + id}>
            {label}
            {id === "services" ? " ⌄" : ""}
          </a>
        ))}
      </nav>
      <div className="header-actions">
        <a className="btn btn-ghost" href="#login">
          Login
        </a>
        <a className="btn btn-primary" href="#register">
          Register
        </a>
      </div>
    </header>
  );
}
