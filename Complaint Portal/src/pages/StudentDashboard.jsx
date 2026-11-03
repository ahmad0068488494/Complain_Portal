import Dashboard from "./Dashboard.jsx";

// Student dashboard entry point. Keep student-only navigation and behavior here.
export default function StudentDashboard({ session, profile, onSignOut }) {
  return <Dashboard session={session} profile={{ ...profile, role: "student" }} onSignOut={onSignOut} dashboardRole="student" />;
}
