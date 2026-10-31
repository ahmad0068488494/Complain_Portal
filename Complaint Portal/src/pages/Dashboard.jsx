import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";

const labels = { pending: "Pending", in_progress: "In progress", resolved: "Resolved", rejected: "Rejected" };
const categories = ["Academic Issues", "Infrastructure & Facilities", "Faculty & Staff", "Hostel & Accommodation", "Food & Canteen", "Safety & Security", "Fees & Administration", "Transportation", "Other Issues"];
const demoComplaints = [
  { id: "DEMO-001", title: "Projector not working in Lab 2", description: "The projector has not been working during practical sessions.", category: "Infrastructure & Facilities", status: "pending", created_at: "2026-10-29T09:15:00Z", user_id: "demo-student", student_name: "Demo Student", admin_remarks: "" },
  { id: "DEMO-002", title: "Need clarification on assignment deadline", description: "Requesting confirmation of the revised submission date.", category: "Academic Issues", status: "in_progress", created_at: "2026-10-27T12:30:00Z", user_id: "demo-student", student_name: "Demo Student", admin_remarks: "Forwarded to the department." },
  { id: "DEMO-003", title: "Library access card issue", description: "My card is not allowing entry to the library.", category: "Other Issues", status: "resolved", created_at: "2026-10-24T08:00:00Z", user_id: "demo-student", student_name: "Demo Student", admin_remarks: "Access has been restored." },
];
const dateLabel = value => value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

export default function Dashboard({ session, profile, onSignOut }) {
  const admin = profile?.role === "admin";
  const [items, setItems] = useState([]);
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
  const [demoMode, setDemoMode] = useState(!supabase);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    if (!supabase) { setItems(demoComplaints.filter(x => admin || x.user_id === "demo-student")); setDemoMode(true); setLoading(false); return; }
    let q = supabase.from("complaints").select("*").order("created_at", { ascending: false });
    if (!admin) q = q.eq("user_id", session.user.id);
    const { data, error: fetchError } = await q;
    if (fetchError) { setError(fetchError.message); setItems([]); }
    else { setItems(data || []); setDemoMode(false); }
    setLoading(false);
  }, [admin, session?.user?.id]);

  useEffect(() => { load(); }, [load]);

  async function create(e) {
    e.preventDefault(); setError(""); setNotice("");
    const referenceId = `CP-${new Date().getFullYear()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    if (demoMode || !supabase) {
      setItems(old => [{ id: "DEMO-" + Date.now(), reference_id: referenceId, title: title.trim(), description: description.trim(), category, status: "pending", created_at: new Date().toISOString(), user_id: "demo-student", student_name: profileName || "Demo Student" }, ...old]);
      setTitle(""); setDescription(""); setNotice(`Demo complaint ID: ${referenceId}. This is a local preview only, not saved to the database.`); return;
    }
    const { error: insertError } = await supabase.from("complaints").insert({ reference_id: referenceId, user_id: session.user.id, title: title.trim(), description: description.trim(), category, status: "pending" });
    if (insertError) { setError(insertError.message); return; }
    setTitle(""); setDescription(""); setNotice(`Complaint submitted successfully. Your Complaint ID is ${referenceId}. Save this ID to track your complaint.`); await load();
  }

  async function changeStatus(id, status) {
    if (demoMode || String(id).startsWith("DEMO-")) {
      setItems(old => old.map(x => x.id === id ? { ...x, status } : x));
      setNotice("Demo status changed locally only."); return;
    }
    setError(""); setNotice("");
    const { error: updateError } = await supabase.from("complaints").update({ status, ...(remarks[id]?.trim() ? { admin_remarks: remarks[id].trim() } : {}) }).eq("id", id);
    if (updateError) setError(updateError.message);
    else { setNotice("Complaint updated."); await load(); }
  }

  const visibleItems = useMemo(() => items.filter(x => (filter === "all" || x.status === filter) && (x.title + " " + x.description + " " + x.category + " " + (x.student_name || "")).toLowerCase().includes(query.toLowerCase())), [items, filter, query]);
  const counts = items.reduce((a, x) => (a[x.status] = (a[x.status] || 0) + 1, a), {});
  const categoryCounts = categories.map(name => ({ name, count: items.filter(x => x.category === name).length })).filter(x => x.count).sort((a, b) => b.count - a.count);
  const stats = [["Total complaints", items.length, "layers"], ["Pending", counts.pending || 0, "clock"], ["In progress", counts.in_progress || 0, "activity"], ["Resolved", counts.resolved || 0, "check-circle"]];

  return <section className={"dashboard-wrap " + (!admin ? "student-dashboard-shell" : "")}>
    {!admin && <aside className="student-sidebar"><div className="student-sidebar-brand"><span className="student-brand-mark">C</span><div><strong>COMPLAINT</strong><small>STUDENT PORTAL</small></div></div><div className="student-sidebar-label">MENU</div><button className="active" onClick={() => document.getElementById("student-dashboard-content")?.scrollIntoView({ behavior: "smooth" })}><span>▦</span>Dashboard</button><button onClick={() => document.getElementById("raise-complaint-form")?.scrollIntoView({ behavior: "smooth" })}><span>▤</span>Raise Complaint</button><button onClick={() => document.getElementById("student-complaint-history")?.scrollIntoView({ behavior: "smooth" })}><span>▧</span>My Complaints</button><button onClick={() => document.getElementById("student-profile")?.scrollIntoView({ behavior: "smooth" })}><span>♙</span>Profile</button><button className="student-sidebar-logout" onClick={onSignOut}><span>↪</span>Logout</button><div className="student-sidebar-footer">Campus Grievance System<br/><small>Student services</small></div></aside>}<div className="student-main-content" id="student-dashboard-content">
    <div className="dashboard-top"><div><span className="eyebrow">{admin ? "ADMINISTRATION / OVERVIEW" : "STUDENT PORTAL"}</span><h1>{admin ? "Admin Dashboard" : "Student Dashboard"}</h1><p>{admin ? "Welcome back, " + (profile?.full_name || session?.user?.email || "there") + ". Here is your campus grievance overview." : "Track and manage your campus complaints in one place."}</p></div><div className="dashboard-top-actions">{!admin && <span className="student-user-chip"><span className="student-user-avatar">♙</span><span><strong>{profile?.full_name || session?.user?.email?.split("@")[0] || "Student"}</strong><small>Student</small></span></span>}{admin && <><span className="dashboard-role">Admin access</span><button className="btn btn-outline" onClick={onSignOut}>Sign out</button></>}</div></div>
    {demoMode && <div className="dashboard-demo-note"><strong>Preview / demo data</strong><span>Sample complaints are illustrative only. Changes in demo mode stay in this browser session and are not saved to Supabase.</span></div>}
    {error && <p className="error" role="alert">{error}</p>}{notice && <p className="info" role="status">{notice}</p>}
    {!admin && <div className="student-welcome-panel"><div><span className="eyebrow">STUDENT OVERVIEW</span><h2>Your campus, your voice.</h2><p>Submit concerns and follow their resolution progress.</p></div><button className="btn btn-primary" onClick={() => document.getElementById("raise-complaint-form")?.scrollIntoView({ behavior: "smooth" })}>+ Raise Complaint</button></div>}
    {!admin && <section id="student-profile" className="dashboard-profile-card"><span className="dashboard-avatar">{(profileName || session?.user?.email || "S").slice(0, 1).toUpperCase()}</span><div><span className="eyebrow">ACCOUNT</span><h2>Student profile</h2><p>{session?.user?.email}</p><label>Display name<input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Your full name" /></label><small>Profile editing is a local UI preview until a profile update policy/API is configured.</small></div></section>}
    <div className="dashboard-stats">{stats.map(([label, number, icon], i) => <div className="dashboard-stat-card" key={label}><span className={"dashboard-stat-icon stat-icon-" + i}>{icon === "layers" ? "▤" : icon === "clock" ? "◷" : icon === "activity" ? "↗" : "✓"}</span><small>{label}</small><strong>{number}</strong><span className="dashboard-stat-foot">{i === 0 ? "Across the portal view" : "Current status"}</span></div>)}</div>
    {!admin ? <>
      <div className="dashboard-section-heading"><div><span className="eyebrow">QUICK ACTION</span><h2>Raise a new complaint</h2><p>Share the details so the right team can review your concern.</p></div></div>
      <form id="raise-complaint-form" className="dashboard-form" onSubmit={create}><label>Complaint title<input value={title} onChange={e => setTitle(e.target.value)} minLength={3} maxLength={160} required placeholder="e.g. Classroom projector not working" /></label><label>Grievance category<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>Describe your concern<textarea value={description} onChange={e => setDescription(e.target.value)} minLength={10} maxLength={10000} rows={4} required placeholder="Include relevant details, location and when the issue occurred." /></label><div className="dashboard-form-footer"><small>Please avoid including passwords or unnecessary sensitive information.</small><button className="btn btn-primary" type="submit">Submit complaint <span aria-hidden="true">→</span></button></div></form>
      <div className="dashboard-section-heading" id="student-complaint-history"><div><span className="eyebrow">YOUR RECORDS</span><h2>My complaints</h2><p>Follow each complaint's progress and read administrator updates.</p></div><button className="btn btn-outline" onClick={load}>↻ Refresh</button></div>
    </> : <>
      <div className="dashboard-admin-grid"><section className="dashboard-panel"><div className="dashboard-panel-title"><div><span className="eyebrow">INSIGHTS</span><h2>Complaints by category</h2></div></div>{categoryCounts.length ? categoryCounts.map(c => <div className="category-bar-row" key={c.name}><div><span>{c.name}</span><strong>{c.count}</strong></div><div className="category-bar-track"><span style={{ width: Math.max(6, c.count / Math.max(1, items.length) * 100) + "%" }} /></div></div>) : <p className="dashboard-empty">Category insights will appear when complaints are available.</p>}</section><section className="dashboard-panel"><span className="eyebrow">WORK QUEUE</span><h2>Needs attention</h2><div className="queue-metric"><strong>{(counts.pending || 0) + (counts.in_progress || 0)}</strong><span>complaints still open</span></div><p>Review pending cases, update progress, and leave a clear remark for students.</p><button className="btn btn-primary" onClick={() => { setFilter("pending"); document.getElementById("complaint-management")?.scrollIntoView({ behavior: "smooth" }); }}>Review pending →</button></section></div>
      <div className="dashboard-section-heading" id="complaint-management"><div><span className="eyebrow">CASEWORK</span><h2>Complaint management</h2><p>Search submissions, filter by status, and update case progress.</p></div><button className="btn btn-outline" onClick={load}>↻ Refresh</button></div>
    </>}
    <div className="dashboard-toolbar"><input aria-label="Search complaints" placeholder={admin ? "Search title, student or category…" : "Search your complaints…"} value={query} onChange={e => setQuery(e.target.value)} /><select aria-label="Filter by status" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All statuses</option>{Object.entries(labels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
    {loading ? <p>Loading complaints…</p> : visibleItems.length === 0 ? <p className="dashboard-empty">No complaints match this view yet.</p> : <div className="dashboard-complaints">{visibleItems.map(x => <article className="dashboard-complaint" key={x.id}><div className="complaint-heading"><div><span className="complaint-category">{x.category}</span><h3>{x.title}</h3>{admin && <small>Submitted by {x.student_name || x.user_id || "Student"}</small>}</div><span className={"status-pill status-" + x.status}>{labels[x.status] || x.status}</span></div><p>{x.description}</p><div className="dashboard-record-meta"><small>Reference: {String(x.id).startsWith("DEMO-") ? x.id : String(x.id).slice(0, 8)}</small><small>Submitted {dateLabel(x.created_at)}</small></div>{x.admin_remarks && <div className="dashboard-remark"><strong>Administrator update</strong><p>{x.admin_remarks}</p></div>}{admin && <div className="admin-case-actions"><label className="status-control">Update status<select value={x.status} onChange={e => changeStatus(x.id, e.target.value)}>{Object.entries(labels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>{!String(x.id).startsWith("DEMO-") && <label className="status-control">Remark for student<input value={remarks[x.id] ?? x.admin_remarks ?? ""} onChange={e => setRemarks(old => ({ ...old, [x.id]: e.target.value }))} placeholder="Add an update or next step" /></label>}</div>}</article>)}</div>}
    </div>
  </section>;
}
