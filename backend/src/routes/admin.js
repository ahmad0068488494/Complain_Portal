import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

async function listAllAuthUsers() {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return { users: null, error };
    const batch = data?.users || [];
    users.push(...batch);
    if (batch.length < 1000) break;
  }
  return { users, error: null };
}

// Reuse the Auth directory for both admin screens rather than fetching every
// Auth user again on each dashboard refresh.
let authUsersCache = null;
let authUsersCacheExpiresAt = 0;
let authUsersRequest = null;

async function listAllAuthUsersCached() {
  if (authUsersCache && Date.now() < authUsersCacheExpiresAt) {
    return { users: authUsersCache, error: null };
  }
  if (authUsersRequest) return authUsersRequest;
  authUsersRequest = listAllAuthUsers();
  try {
    const result = await authUsersRequest;
    if (!result.error) {
      authUsersCache = result.users;
      authUsersCacheExpiresAt = Date.now() + 60 * 1000;
    }
    return result;
  } finally {
    authUsersRequest = null;
  }
}

router.get("/users", async (_req, res) => {
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id,full_name,role,phone,crn_number,department,course,semester,academic_session,date_of_birth,gender,alternate_phone,alternate_email,current_address,permanent_address,city,state,pincode,avatar_url,created_at")
    .in("role", ["student", "admin"])
    .order("full_name", { ascending: true });

  if (profileError) {
    console.error("Admin user directory query failed:", profileError);
    return res.status(500).json({ error: "Could not fetch portal users." });
  }

  const { users: authUsers, error: authError } = await listAllAuthUsersCached();
  if (authError) {
    console.error("Admin user directory query failed:", authError);
    return res.status(500).json({ error: "Could not fetch user email addresses." });
  }

  const emailById = new Map(authUsers.map((user) => [user.id, user.email || ""]));
  const users = (profiles || []).map((person) => ({ ...person, email: emailById.get(person.id) || "" }));
  const students = await Promise.all(
    users.filter((person) => person.role === "student").map(async (person) => {
      if (!person.avatar_url) {
        const { avatar_url, ...student } = person;
        return student;
      }
      const { data: signed, error: signedError } = await supabase.storage
        .from("student-avatars")
        .createSignedUrl(person.avatar_url, 3600);
      const { avatar_url, ...student } = person;
      return { ...student, avatar_signed_url: signedError ? "" : signed?.signedUrl || "" };
    }),
  );
  res.json({
    students,
    staff: users.filter((person) => person.role === "admin"),
  });
});

router.get("/complaints", async (_req, res) => {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin complaints query failed:", error);
    return res.status(500).json({ error: "Could not fetch complaints." });
  }

  const profileIds = [...new Set((data || []).flatMap((item) => [item.user_id, item.assigned_to].filter(Boolean)))];
  const { data: profiles, error: profileError } = profileIds.length
    ? await supabase.from("profiles")
        .select("id,full_name,phone,crn_number,department,course,semester")
        .in("id", profileIds)
    : { data: [], error: null };

  if (profileError) {
    console.error("Admin complaint profile lookup failed:", profileError);
    return res.status(500).json({ error: "Could not fetch complaint student details." });
  }

  const profileById = new Map((profiles || []).map((person) => [person.id, person]));
  const { users: authUsers, error: authError } = await listAllAuthUsers();
  if (authError) {
    console.error("Admin complaint email lookup failed:", authError);
    return res.status(500).json({ error: "Could not fetch complaint contact details." });
  }
  const emailById = new Map(authUsers.map((user) => [user.id, user.email || ""]));

  const complaints = await Promise.all((data || []).map(async (item) => {
    const student = profileById.get(item.user_id) || {};
    const assignee = profileById.get(item.assigned_to) || {};
    let evidence_signed_url = "";
    if (item.evidence_path) {
      const { data: signed, error: signedError } = await supabase.storage
        .from("complaint-evidence")
        .createSignedUrl(item.evidence_path, 3600);
      evidence_signed_url = signedError ? "" : signed?.signedUrl || "";
    }
    return {
      ...item,
      evidence_signed_url,
      student_name: student.full_name || "Student",
      student_email: emailById.get(item.user_id) || "",
      student_phone: student.phone || "",
      student_crn: student.crn_number || "",
      student_department: student.department || "",
      student_course: student.course || "",
      student_semester: student.semester || "",
      assigned_name: assignee.full_name || "",
    };
  }));

  res.json({ complaints });
});

router.patch("/complaints/:id/assignment", async (req, res) => {
  const { assigned_to } = req.body || {};
  const requestedAssignee = assigned_to || null;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (requestedAssignee !== null && (typeof requestedAssignee !== "string" || !uuidPattern.test(requestedAssignee))) {
    return res.status(400).json({ error: "Choose a valid administrator account." });
  }

  let nextAssignee = null;
  if (requestedAssignee) {
    const { data, error } = await supabase.from("profiles")
      .select("id,role").eq("id", requestedAssignee).maybeSingle();
    if (error) return res.status(500).json({ error: "Could not verify the selected administrator." });
    if (!data || data.role !== "admin") {
      return res.status(400).json({ error: "Complaints can only be assigned to an administrator account." });
    }
    nextAssignee = data.id;
  }

  const { data, error } = await supabase.from("complaints")
    .update({
      assigned_to: nextAssignee,
      assigned_by: nextAssignee ? req.user.id : null,
      assigned_at: nextAssignee ? new Date().toISOString() : null,
    })
    .eq("id", req.params.id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Complaint assignment failed:", error);
    return res.status(500).json({ error: "Could not assign complaint." });
  }
  if (!data) return res.status(404).json({ error: "Complaint not found." });
  res.json({ complaint: data });
});

router.patch("/complaints/:id/status", async (req, res) => {
  const allowedStatuses = ["pending", "in_progress", "resolved", "rejected"];
  const { status, admin_remarks = "" } = req.body || {};

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid complaint status." });
  }
  if (typeof admin_remarks !== "string" || admin_remarks.length > 2000) {
    return res.status(400).json({ error: "Remarks must be 2000 characters or fewer." });
  }

  const { data, error } = await supabase
    .from("complaints")
    .update({ status, admin_remarks: admin_remarks.trim() })
    .eq("id", req.params.id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Admin complaint update failed:", error);
    return res.status(500).json({ error: "Could not update complaint." });
  }
  if (!data) return res.status(404).json({ error: "Complaint not found." });

  res.json({ complaint: data });
});

export default router;
