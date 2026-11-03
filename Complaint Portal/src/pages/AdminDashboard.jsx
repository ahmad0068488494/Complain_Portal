import Dashboard from "./Dashboard.jsx";

// Admin dashboard entry point. Admin-only controls are rendered by the shared dashboard implementation.
export default function AdminDashboard({ session, profile, onSignOut }) {
  return <Dashboard session={session} profile={{ ...profile, role: "admin" }} onSignOut={onSignOut} dashboardRole="admin" />;
}
