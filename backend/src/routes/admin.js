import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/complaints", async (_req, res) => {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin complaints query failed:", error);
    return res.status(500).json({ error: "Could not fetch complaints." });
  }

  res.json({ complaints: data || [] });
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
