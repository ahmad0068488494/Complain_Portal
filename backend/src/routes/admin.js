import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/users", async (_req, res) => {
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id,full_name,role,phone,crn_number,department,course,semester,academic_session,created_at")
    .in("role", ["student", "admin"])
    .order("full_name", { ascending: true });

  if (profileError) {
    console.error("Admin user directory query failed:", profileError);
    return res.status(500).json({ error: "Could not fetch portal users." });
  }

  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authError) {
    console.error("Admin auth directory query failed:", authError);
    return res.status(500).json({ error: "Could not fetch user email addresses." });
  }

  const emailById = new Map((authData.users || []).map((user) => [user.id, user.email || ""]));
  const users = (profiles || []).map((person) => ({ ...person, email: emailById.get(person.id) || "" }));
  res.json({
    students: users.filter((person) => person.role === "student"),
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
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authError) {
    console.error("Admin complaint email lookup failed:", authError);
    return res.status(500).json({ error: "Could not fetch complaint contact details." });
  }
  const emailById = new Map((authData.users || []).map((user) => [user.id, user.email || ""]));

  const complaints = (data || []).map((item) => {
    const student = profileById.get(item.user_id) || {};
    const assignee = profileById.get(item.assigned_to) || {};
    return {
      ...item,
      student_name: student.full_name || "Student",
      student_email: emailById.get(item.user_id) || "",
      student_phone: student.phone || "",
      student_crn: student.crn_number || "",
      student_department: student.department || "",
      student_course: student.course || "",
      student_semester: student.semester || "",
      assigned_name: assignee.full_name || "",
    };
  });

  res.json({ complaints });
});

router.patch("/complaints/:id/assignment", async (req, res) => {
  const { assigned_to } = req.body || {};
  if (assigned_to !== null && assigned_to !== "" && (typeof assigned_to !== "string" || !/^[0-9a-f-]{36}$/i.test(assigned_to))) {
    return res.status(400).json({ error: "Choose a valid administrator account." });
  }

  let nextAssignee = null;
  if (assigned_to) {
    const { data, error } = await supabase.from("profiles")
      .select("id,role").eq("id", assigned_to).maybeSingle();
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
