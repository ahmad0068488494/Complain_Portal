import { useState } from "react";
export default function AuthPage({ mode }) {
  const register = mode === "register",
    [role, setRole] = useState("student"),
    [show, setShow] = useState(false),
    [notice, setNotice] = useState("");
  function submit(e) {
    e.preventDefault();
    setNotice(
      "UI validation passed. Secure authentication will be enabled when the backend is integrated.",
    );
  }
  return (
    <section className="auth-page">
      <div className="auth-heading">
        <span className="eyebrow">COLLEGE COMPLAINT PORTAL</span>
        <h1>{register ? "Create your account" : "Welcome back"}</h1>
        <p>Your Voice Matters · Report · Track · Resolve</p>
      </div>
      <div className="auth-panel">
        <aside className="auth-aside">
          <h2>{register ? "Join your campus community." : "Who are you?"}</h2>
          <p>
            {register
              ? "Create an account to raise complaints and view updates."
              : "Select your role to continue to the portal."}
          </p>
          {[
            [
              "student",
              "♙",
              "Student",
              "Raise complaints, track progress and view updates.",
            ],
            [
              "admin",
              "⚙",
              "Admin / Staff",
              "Manage complaints and update status.",
            ],
          ].map(([value, icon, title, desc]) => (
            <button
              type="button"
              className={"role-option " + (role === value ? "selected" : "")}
              key={value}
              onClick={() => setRole(value)}
            >
              <span>{icon}</span>
              <div>
                <strong>{title}</strong>
                <small>{desc}</small>
              </div>
              <b>{role === value ? "●" : "○"}</b>
            </button>
          ))}
          <div className="campus-tag">
            ▥ &nbsp; Together for a <strong>Better Campus</strong>
          </div>
        </aside>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-tabs">
            <a className={!register ? "selected" : ""} href="#login">
              Login
            </a>
            <a className={register ? "selected" : ""} href="#register">
              Register
            </a>
          </div>
          <h3>
            {register
              ? "Student registration"
              : role === "admin"
                ? "Admin / Staff login"
                : "Student login"}
          </h3>
          {register && (
            <>
              <label>
                Full name
                <input required placeholder="Enter your full name" />
              </label>
              <label>
                Email address
                <input type="email" required placeholder="you@college.edu" />
              </label>
              <div className="two-fields">
                <label>
                  Registration number
                  <input required placeholder="Registration no." />
                </label>
                <label>
                  Department
                  <select required defaultValue="">
                    <option value="" disabled>
                      Select department
                    </option>
                    <option>Computer Science</option>
                    <option>Management</option>
                    <option>Engineering</option>
                    <option>Other</option>
                  </select>
                </label>
              </div>
            </>
          )}
          {!register && (
            <label>
              Email / Registration Number
              <input
                required
                placeholder="Enter email or registration number"
              />
            </label>
          )}
          <label>
            Password
            <div className="password-input">
              <input
                type={show ? "text" : "password"}
                required
                minLength={8}
                placeholder={register ? "Create a password" : "Enter password"}
              />
              <button type="button" onClick={() => setShow(!show)}>
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </label>
          {register && (
            <label>
              Confirm password
              <input
                type="password"
                required
                minLength={8}
                placeholder="Confirm password"
              />
            </label>
          )}
          {register && (
            <label className="terms">
              <input type="checkbox" required /> I agree to the portal terms and
              privacy policy.
            </label>
          )}
          {!register && (
            <div className="forgot-row">
              <label>
                <input type="checkbox" /> Remember me
              </label>
              <a
                href="#login"
                onClick={(e) => {
                  e.preventDefault();
                  setNotice(
                    "Password recovery will be added with email service configuration.",
                  );
                }}
              >
                Forgot password?
              </a>
            </div>
          )}
          <button className="btn btn-primary auth-submit">
            {register ? "Create account" : "Sign in"} →
          </button>
          {notice && (
            <p className="info" role="status">
              {notice}
            </p>
          )}
          <p className="auth-switch">
            {register ? "Already have an account?" : "Don’t have an account?"}{" "}
            <a href={register ? "#login" : "#register"}>
              {register ? "Login here" : "Register here"}
            </a>
          </p>
        </form>
      </div>
    </section>
  );
}
