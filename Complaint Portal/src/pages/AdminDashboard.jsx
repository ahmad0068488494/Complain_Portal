import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { apiRequest } from "../lib/api.js";

const labels = {
  pending: "Pending",
  in_progress: "In progress",
  resolved: "Resolved",
  rejected: "Rejected",
};
const categories = [
  "Academic Issues",
  "Infrastructure & Facilities",
  "Faculty & Staff",
  "Hostel & Accommodation",
  "Food & Canteen",
  "Safety & Security",
  "Fees & Administration",
  "Transportation",
  "Other Issues",
];
const demoComplaints = [
  {
    id: "DEMO-001",
    title: "Projector not working in Lab 2",
    description:
      "The projector has not been working during practical sessions.",
    category: "Infrastructure & Facilities",
    status: "pending",
    created_at: "2026-10-29T09:15:00Z",
    user_id: "demo-student",
    student_name: "Demo Student",
    admin_remarks: "",
  },
  {
    id: "DEMO-002",
    title: "Need clarification on assignment deadline",
    description: "Requesting confirmation of the revised submission date.",
    category: "Academic Issues",
    status: "in_progress",
    created_at: "2026-10-27T12:30:00Z",
    user_id: "demo-student",
    student_name: "Demo Student",
    admin_remarks: "Forwarded to the department.",
  },
  {
    id: "DEMO-003",
    title: "Library access card issue",
    description: "My card is not allowing entry to the library.",
    category: "Other Issues",
    status: "resolved",
    created_at: "2026-10-24T08:00:00Z",
    user_id: "demo-student",
    student_name: "Demo Student",
    admin_remarks: "Access has been restored.",
  },
];
const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

export default function AdminDashboard({ session, profile, onSignOut }) {
  const admin = true;
  const [items, setItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[1]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [profileName, setProfileName] = useState(profile?.full_name || "");
  const [remarks, setRemarks] = useState({});
  const [savingRemarkId, setSavingRemarkId] = useState(null);
  const [demoMode, setDemoMode] = useState(!supabase);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    if (!supabase) {
      setItems(demoComplaints);
      setStudents([{
        id: "demo-student", full_name: "Demo Student", email: "student@example.test",
        phone: "Not provided", crn_number: "DEMO-001", department: "Computer Science",
        course: "MCA", semester: "1", academic_session: "Demo session",
      }]);
      setStaff([{ id: "demo-admin", full_name: "Portal Administrator", email: "admin@example.test" }]);
      setDemoMode(true);
      setLoading(false);
      return;
    }

    try {
      const [complaintResult, directoryResult] = await Promise.all([
        apiRequest("/admin/complaints", { session }),
        apiRequest("/admin/users", { session }),
      ]);
      setItems(complaintResult.complaints || []);
      setStudents(directoryResult.students || []);
      setStaff(directoryResult.staff || []);
      setDemoMode(false);
    } catch (requestError) {
      setError(requestError.message || "Could not load administration data.");
      setItems([]);
      setStudents([]);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (demoMode || !supabase) {
      const referenceId = `CP-${new Date().getFullYear()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
      setItems((old) => [
        {
          id: "DEMO-" + Date.now(),
          reference_id: referenceId,
          title: title.trim(),
          description: description.trim(),
          category,
          status: "pending",
          created_at: new Date().toISOString(),
          user_id: "demo-student",
          student_name: profileName || "Demo Student",
        },
        ...old,
      ]);
      setTitle("");
      setDescription("");
      setNotice(`Demo complaint ID: ${referenceId}. This is a local preview only.`);
      return;
    }

    try {
      const result = await apiRequest("/complaints", {
        session,
        method: "POST",
        body: { title: title.trim(), description: description.trim(), category },
      });
      setTitle("");
      setDescription("");
      setNotice(`Complaint submitted. Reference ID: ${result.complaint.reference_id}.`);
      await load();
    } catch (requestError) {
      setError(requestError.message || "Could not submit the complaint.");
    }
  }

  async function changeStatus(id, status) {
    if (demoMode || String(id).startsWith("DEMO-")) {
      setItems((old) => old.map((x) => (x.id === id ? { ...x, status } : x)));
      setNotice("Demo status changed locally only.");
      return;
    }

    setError("");
    setNotice("");
    try {
      await apiRequest(`/admin/complaints/${encodeURIComponent(id)}/status`, {
        session,
        method: "PATCH",
        body: {
          status,
          admin_remarks: remarks[id] ?? items.find((item) => item.id === id)?.admin_remarks ?? "",
        },
      });
      setNotice("Complaint status and administrator remarks updated.");
      await load();
    } catch (requestError) {
      setError(requestError.message || "Could not update the complaint.");
    }
  }


  async function saveRemarks(id) {
    setError("");
    setNotice("");
    const currentComplaint = items.find((item) => item.id === id);
    if (!currentComplaint) return;
    setSavingRemarkId(id);
    try {
      await apiRequest(`/admin/complaints/${encodeURIComponent(id)}/status`, {
        session,
        method: "PATCH",
        body: {
          status: currentComplaint.status,
          admin_remarks: remarks[id] ?? currentComplaint.admin_remarks ?? "",
        },
      });
      await load();
      setNotice("Administrator remark saved successfully.");
    } catch (requestError) {
      setError(requestError.message || "Could not save the administrator remark.");
    } finally {
      setSavingRemarkId(null);
    }
  }

  async function assignComplaint(id, assignedTo) {
    setError("");
    setNotice("");
    if (demoMode || String(id).startsWith("DEMO-")) {
      const assignee = staff.find((person) => person.id === assignedTo);
      setItems((old) => old.map((item) => item.id === id
        ? { ...item, assigned_to: assignedTo || null, assigned_name: assignee?.full_name || null }
        : item));
      setNotice("Demo assignment updated locally only.");
      return;
    }

    try {
      await apiRequest(`/admin/complaints/${encodeURIComponent(id)}/assignment`, {
        session,
        method: "PATCH",
        body: { assigned_to: assignedTo || null },
      });
      setNotice(assignedTo ? "Complaint assigned successfully." : "Complaint assignment removed.");
      await load();
    } catch (requestError) {
      setError(requestError.message || "Could not assign this complaint.");
    }
  }

  const visibleItems = useMemo(
    () =>
      items.filter(
        (x) =>
          (filter === "all" || x.status === filter) &&
          (
            x.title +
            " " +
            x.description +
            " " +
            x.category +
            " " +
            (x.reference_id || "") +
            " " +
            (x.student_name || "") +
            " " +
            (x.student_email || "") +
            " " +
            (x.student_crn || "")
          )
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, filter, query],
  );
  const visibleStudents = useMemo(() => {
    const search = studentQuery.trim().toLowerCase();
    if (!search) return students;
    return students.filter((student) =>
      [
        student.full_name,
        student.email,
        student.phone,
        student.crn_number,
        student.department,
        student.course,
        student.semester,
      ].filter(Boolean).join(" ").toLowerCase().includes(search)
    );
  }, [students, studentQuery]);

  const counts = items.reduce(
    (a, x) => ((a[x.status] = (a[x.status] || 0) + 1), a),
    {},
  );
  const categoryCounts = categories
    .map((name) => ({
      name,
      count: items.filter((x) => x.category === name).length,
    }))
    .filter((x) => x.count)
    .sort((a, b) => b.count - a.count);
  const stats = [
    ["Total complaints", items.length, "layers"],
    ["Pending", counts.pending || 0, "clock"],
    ["In progress", counts.in_progress || 0, "activity"],
    ["Resolved", counts.resolved || 0, "check-circle"],
    ["Rejected", counts.rejected || 0, "x-circle"],
    ["Registered students", students.length, "users"],
  ];

  return (
    <section
      className={"dashboard-wrap " + (!admin ? "student-dashboard-shell" : "admin-dashboard-shell")}
    >
      {!admin && (
        <aside className="student-sidebar">
          <div className="student-sidebar-brand">
            <span className="student-brand-mark">C</span>
            <div>
              <strong>COMPLAINT</strong>
              <small>STUDENT PORTAL</small>
            </div>
          </div>
          <div className="student-sidebar-label">MENU</div>
          <button
            className="active"
            onClick={() =>
              document
                .getElementById("student-dashboard-content")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>▦</span>Dashboard
          </button>
          <button
            onClick={() =>
              document
                .getElementById("raise-complaint-form")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>▤</span>Raise Complaint
          </button>
          <button
            onClick={() =>
              document
                .getElementById("student-complaint-history")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>▧</span>My Complaints
          </button>
          <button
            onClick={() =>
              document
                .getElementById("student-profile")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>♙</span>Profile
          </button>
          <button className="student-sidebar-logout" onClick={onSignOut}>
            <span>↪</span>Logout
          </button>
          <div className="student-sidebar-footer">
            Campus Grievance System
            <br />
            <small>Student services</small>
          </div>
        </aside>
      )}
      {admin && (
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <span className="admin-sidebar-mark">C</span>
            <div><strong>COMPLAINT</strong><small>ADMINISTRATION</small></div>
          </div>
          <div className="admin-sidebar-label">WORKSPACE</div>
          <button type="button" title="Overview" aria-label="Overview" className="active" onClick={() => document.getElementById("student-dashboard-content")?.scrollIntoView({ behavior: "smooth" })}><span>▦</span>Overview</button>
          <button type="button" title="Complaints" aria-label="Complaints" onClick={() => document.getElementById("complaint-management")?.scrollIntoView({ behavior: "smooth" })}><span>▤</span>Complaints</button>
          <button type="button" title="Assignments" aria-label="Assignments" onClick={() => document.getElementById("admin-assignment-queue")?.scrollIntoView({ behavior: "smooth" })}><span>⇄</span>Assignments</button>
          <button type="button" title="Analytics" aria-label="Analytics" onClick={() => document.getElementById("admin-analytics")?.scrollIntoView({ behavior: "smooth" })}><span>▥</span>Analytics</button>
          <button type="button" title="Students" aria-label="Students" onClick={() => document.getElementById("admin-students")?.scrollIntoView({ behavior: "smooth" })}><span>♙</span>Students</button>
          <button type="button" title="Profile" aria-label="Profile" onClick={() => document.getElementById("admin-profile")?.scrollIntoView({ behavior: "smooth" })}><span>◎</span>Profile</button>
          <button type="button" title="Sign out" aria-label="Sign out" className="admin-sidebar-logout" onClick={onSignOut}><span>↪</span>Sign out</button>
          <div className="admin-sidebar-footer">Campus Grievance System<small>Administration workspace</small></div>
        </aside>
      )}
      <div className={admin ? "admin-main-content" : "student-main-content"} id="student-dashboard-content">
        <div
          className={
            "dashboard-top " + (!admin ? "student-dashboard-title-hidden" : "")
          }
        >
          <div>
            <span className="eyebrow">
              {admin ? "ADMINISTRATION / OVERVIEW" : "STUDENT PORTAL"}
            </span>
            <h1>{admin ? "Admin Dashboard" : "Student Dashboard"}</h1>
            <p>
              {admin
                ? "Welcome back, " +
                  (profile?.full_name || session?.user?.email || "there") +
                  ". Here is your campus grievance overview."
                : "Track and manage your campus complaints in one place."}
            </p>
          </div>
          <div className="dashboard-top-actions">
            {!admin && (
              <span className="student-user-chip">
                <span className="student-user-avatar">♙</span>
                <span>
                  <strong>
                    {profile?.full_name ||
                      session?.user?.email?.split("@")[0] ||
                      "Student"}
                  </strong>
                  <small>Student</small>
                </span>
              </span>
            )}
            {admin && (
              <>
                <span className="dashboard-role">Admin access</span>
                <button className="btn btn-outline" onClick={onSignOut}>
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
        {admin && (
          <section className="admin-profile-card" id="admin-profile">
            <div className="admin-profile-avatar">{(profile?.full_name || "A").slice(0, 1).toUpperCase()}</div>
            <div className="admin-profile-copy">
              <span className="eyebrow">ADMINISTRATOR PROFILE</span>
              <h2>{profile?.full_name || "Portal Administrator"}</h2>
              <p>{session?.user?.email || "Administrator account"}</p>
            </div>
            <span className="admin-profile-role">Verified admin access</span>
          </section>
        )}
        {demoMode && (
          <div className="dashboard-demo-note">
            <strong>Preview / demo data</strong>
            <span>
              Sample complaints are illustrative only. Changes in demo mode stay
              in this browser session and are not saved to Supabase.
            </span>
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="info" role="status">
            {notice}
          </p>
        )}
        {!admin && (
          <div className="student-welcome-panel">
            <div>
              <span className="eyebrow">STUDENT OVERVIEW</span>
              <h2>Your campus, your voice.</h2>
              <p>Submit concerns and follow their resolution progress.</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() =>
                document
                  .getElementById("raise-complaint-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              + Raise Complaint
            </button>
          </div>
        )}
        {!admin && (
          <section
            id="student-profile"
            className="dashboard-profile-card student-info-card"
          >
            <span className="dashboard-avatar">
              {(
                profile?.full_name ||
                session?.user?.user_metadata?.full_name ||
                session?.user?.email ||
                "S"
              )
                .slice(0, 1)
                .toUpperCase()}
            </span>
            <div className="student-info-content">
              <span className="eyebrow">STUDENT INFORMATION</span>
              <h2>
                {profile?.full_name ||
                  session?.user?.user_metadata?.full_name ||
                  "Student"}
              </h2>
              <div className="student-info-grid">
                <div>
                  <small>EMAIL ADDRESS</small>
                  <strong>{session?.user?.email || "—"}</strong>
                </div>
                <div>
                  <small>CONTACT NUMBER</small>
                  <strong>
                    {session?.user?.user_metadata?.phone ||
                      "Not provided at registration"}
                  </strong>
                </div>
                <div>
                  <small>DEPARTMENT</small>
                  <strong>
                    {session?.user?.user_metadata?.department || "Not provided"}
                  </strong>
                </div>
                <div>
                  <small>REGISTRATION NUMBER</small>
                  <strong>
                    {session?.user?.user_metadata?.registration_number ||
                      "Not provided"}
                  </strong>
                </div>
              </div>
            </div>
          </section>
        )}
        <div className="dashboard-stats">
          {stats.map(([label, number, icon], i) => (
            <div className="dashboard-stat-card" key={label}>
              <span className={"dashboard-stat-icon stat-icon-" + i}>
                {icon === "layers" ? "▤"
                  : icon === "clock" ? "◷"
                    : icon === "activity" ? "↗"
                      : icon === "check-circle" ? "✓"
                        : icon === "x-circle" ? "×" : "♙"}
              </span>
              <small>{label}</small>
              <strong>{number}</strong>
              <span className="dashboard-stat-foot">
                {i === 0 ? "Across the portal view" : i === 5 ? "Student profiles" : "Current status"}
              </span>
            </div>
          ))}
        </div>
        {!admin ? (
          <>
            <div className="dashboard-section-heading">
              <div>
                <span className="eyebrow">QUICK ACTION</span>
                <h2>Raise a new complaint</h2>
                <p>
                  Share the details so the right team can review your concern.
                </p>
              </div>
            </div>
            <form
              id="raise-complaint-form"
              className="dashboard-form"
              onSubmit={create}
            >
              <label>
                Complaint title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  minLength={3}
                  maxLength={160}
                  required
                  placeholder="e.g. Classroom projector not working"
                />
              </label>
              <label>
                Grievance category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Describe your concern
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  minLength={10}
                  maxLength={10000}
                  rows={4}
                  required
                  placeholder="Include relevant details, location and when the issue occurred."
                />
              </label>
              <div className="dashboard-form-footer">
                <small>
                  Please avoid including passwords or unnecessary sensitive
                  information.
                </small>
                <button className="btn btn-primary" type="submit">
                  Submit complaint <span aria-hidden="true">→</span>
                </button>
              </div>
            </form>
            <div
              className="dashboard-section-heading"
              id="student-complaint-history"
            >
              <div>
                <span className="eyebrow">YOUR RECORDS</span>
                <h2>My complaints</h2>
                <p>
                  Follow each complaint's progress and read administrator
                  updates.
                </p>
              </div>
              <button className="btn btn-outline" onClick={load}>
                ↻ Refresh
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="dashboard-admin-grid" id="admin-analytics">
              <section className="dashboard-panel">
                <div className="dashboard-panel-title">
                  <div>
                    <span className="eyebrow">INSIGHTS</span>
                    <h2>Complaints by category</h2>
                  </div>
                </div>
                {categoryCounts.length ? (
                  categoryCounts.map((c) => (
                    <div className="category-bar-row" key={c.name}>
                      <div>
                        <span>{c.name}</span>
                        <strong>{c.count}</strong>
                      </div>
                      <div className="category-bar-track">
                        <span
                          style={{
                            width:
                              Math.max(
                                6,
                                (c.count / Math.max(1, items.length)) * 100,
                              ) + "%",
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="dashboard-empty">
                    Category insights will appear when complaints are available.
                  </p>
                )}
              </section>
              <section className="dashboard-panel">
                <span className="eyebrow">WORK QUEUE</span>
                <h2>Needs attention</h2>
                <div className="queue-metric">
                  <strong>
                    {(counts.pending || 0) + (counts.in_progress || 0)}
                  </strong>
                  <span>complaints still open</span>
                </div>
                <p>
                  Review pending cases, update progress, and leave a clear
                  remark for students.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setFilter("pending");
                    document
                      .getElementById("complaint-management")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Review pending →
                </button>
              </section>
            </div>
            <div
              className="dashboard-section-heading"
              id="complaint-management"
            >
              <div>
                <span className="eyebrow">CASEWORK</span>
                <h2>Complaint management</h2>
                <p>
                  Search submissions, filter by status, and update case
                  progress.
                </p>
              </div>
              <button className="btn btn-outline" onClick={load}>
                ↻ Refresh
              </button>
            </div>
          </>
        )}
        <div className="dashboard-toolbar" id={admin ? "admin-assignment-queue" : undefined}>
          <input
            aria-label="Search complaints"
            placeholder={
              admin
                ? "Search title, student or category…"
                : "Search your complaints…"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="Filter by status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {Object.entries(labels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <p>Loading complaints…</p>
        ) : visibleItems.length === 0 ? (
          <p className="dashboard-empty">No complaints match this view yet.</p>
        ) : (
          <div className="dashboard-complaints">
            {visibleItems.map((x) => (
              <article className="dashboard-complaint" key={x.id}>
                <div className="complaint-heading">
                  <div>
                    <span className="complaint-category">{x.category}</span>
                    <h3>{x.title}</h3>
                    {admin && (
                      <small className="admin-complaint-student">
                        <strong>{x.student_name || "Student"}</strong>
                        <span>{x.student_email || "Email unavailable"} · CRN {x.student_crn || "Not provided"}</span>
                        <span>{x.student_phone || "Contact number unavailable"}</span>
                        <span>{x.student_department || "Department not provided"}{x.student_course ? " · " + x.student_course : ""}{x.student_semester ? " · Semester " + x.student_semester : ""}</span>
                      </small>
                    )}
                  </div>
                  <span className={"status-pill status-" + x.status}>
                    {labels[x.status] || x.status}
                  </span>
                </div>
                <p>{x.description}</p>
                <div className="dashboard-record-meta">
                  <small className="complaint-reference-id">
                    <strong>Reference ID:</strong> {x.reference_id || x.id}
                  </small>
                  <small>Submitted {dateLabel(x.created_at)}</small>
                {x.assigned_name && <small>Assigned to {x.assigned_name}</small>}
                </div>
                {x.evidence_signed_url && (
                  <div className="complaint-evidence-preview">
                    <strong>Student-submitted image evidence</strong>
                    <a href={x.evidence_signed_url} target="_blank" rel="noreferrer">
                      <img src={x.evidence_signed_url} alt="Complaint supporting evidence" loading="lazy" />
                      <span>View full image ↗</span>
                    </a>
                  </div>
                )}
                {x.admin_remarks && (
                  <div className="dashboard-remark">
                    <strong>Administrator update</strong>
                    <p>{x.admin_remarks}</p>
                  </div>
                )}
                {admin && (
                  <div className="admin-case-actions">
                    <label className="status-control">
                      Update status
                      <select
                        value={x.status}
                        onChange={(e) => changeStatus(x.id, e.target.value)}
                      >
                        {Object.entries(labels).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="status-control">
                      Assign to administrator
                      <select value={x.assigned_to || ""} onChange={(e) => assignComplaint(x.id, e.target.value)}>
                        <option value="">Unassigned</option>
                        {staff.map((person) => (
                          <option key={person.id} value={person.id}>{person.full_name || person.email || "Administrator"}</option>
                        ))}
                      </select>
                    </label>
                    {!String(x.id).startsWith("DEMO-") && (
                      <div className="admin-remark-editor">
                        <label className="status-control">
                          Remark for student
                          <textarea
                            value={remarks[x.id] ?? x.admin_remarks ?? ""}
                            onChange={(e) =>
                              setRemarks((old) => ({
                                ...old,
                                [x.id]: e.target.value,
                              }))
                            }
                            maxLength={2000}
                            rows={2}
                            placeholder="Add an update or next step"
                          />
                        </label>
                        <button
                          type="button"
                          className="btn btn-outline admin-save-remark"
                          disabled={savingRemarkId === x.id}
                          onClick={() => saveRemarks(x.id)}
                        >
                          {savingRemarkId === x.id ? "Saving…" : "Save remark"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
        {admin && (
          <section className="dashboard-panel admin-students-panel" id="admin-students">
            <div className="dashboard-panel-title">
              <div><span className="eyebrow">USER MANAGEMENT</span><h2>Registered students</h2><p>Student identity and academic information from the portal profiles.</p></div>
              <div className="admin-directory-tools">
                <span className="admin-directory-count">{students.length} students</span>
                <input
                  type="search"
                  aria-label="Search students"
                  placeholder="Search name, email, CRN or department"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                />
              </div>
            </div>
            {loading ? (
              <p className="dashboard-empty">Loading student directory…</p>
            ) : visibleStudents.length ? (
              <div className="admin-student-grid">
                {visibleStudents.map((student) => {
                  const isExpanded = expandedStudentId === student.id;
                  const detailsId = `admin-student-details-${student.id}`;
                  return (
                    <article className={`admin-student-card${isExpanded ? " is-expanded" : ""}`} key={student.id}>
                      <button
                        type="button"
                        className="admin-student-card-trigger"
                        aria-expanded={isExpanded}
                        aria-controls={detailsId}
                        onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                      >
                        <span className="admin-student-card-head">
                          {student.avatar_signed_url ? (
                            <img className="admin-student-avatar-image" src={student.avatar_signed_url} alt="" />
                          ) : (
                            <span className="admin-student-avatar">{(student.full_name || "S").slice(0, 1).toUpperCase()}</span>
                          )}
                          <span className="admin-student-card-identity">
                            <strong>{student.full_name || "Student"}</strong>
                            <small>{student.email || "Email unavailable"}</small>
                          </span>
                        </span>
                        <span className="admin-student-expand-indicator" aria-hidden="true">{isExpanded ? "−" : "+"}</span>
                      </button>
                      {isExpanded && (
                        <div className="admin-student-details" id={detailsId}>
                          <div><small>CRN NUMBER</small><strong>{student.crn_number || "Not provided"}</strong></div>
                          <div><small>CONTACT</small><strong>{student.phone || "Not provided"}</strong></div>
                          <div><small>DEPARTMENT</small><strong>{student.department || "Not provided"}</strong></div>
                          <div><small>COURSE / SEMESTER</small><strong>{student.course || "Not provided"}{student.semester ? " / " + student.semester : ""}</strong></div>
                          <div><small>ACADEMIC SESSION</small><strong>{student.academic_session || "Not assigned"}</strong></div>
                          <div><small>DATE OF BIRTH</small><strong>{student.date_of_birth || "Not provided"}</strong></div>
                          <div><small>GENDER</small><strong>{student.gender || "Not provided"}</strong></div>
                          <div><small>ALTERNATE CONTACT</small><strong>{student.alternate_phone || "Not provided"}</strong></div>
                          <div><small>ALTERNATE EMAIL</small><strong>{student.alternate_email || "Not provided"}</strong></div>
                          <div><small>CURRENT ADDRESS</small><strong>{student.current_address || "Not provided"}</strong></div>
                          <div><small>PERMANENT ADDRESS</small><strong>{student.permanent_address || "Not provided"}</strong></div>
                          <div><small>CITY / STATE</small><strong>{[student.city, student.state].filter(Boolean).join(", ") || "Not provided"}</strong></div>
                          <div><small>PIN CODE</small><strong>{student.pincode || "Not provided"}</strong></div>
                          <div><small>REGISTERED ON</small><strong>{dateLabel(student.created_at)}</strong></div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="dashboard-empty">{students.length ? "No students match this search." : "No registered student profiles were found."}</p>
            )}
          </section>
        )}
      </div>
    </section>
  );
}
