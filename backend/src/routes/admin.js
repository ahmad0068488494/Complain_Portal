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

  if (error) return res.status(500).json({ error: "Could not fetch complaints." });
  res.json({ complaints: data });
});

router.patch("/complaints/:id/status", async (req, res) => {
  const allowedStatuses = ["pending", "in_progress", "resolved", "rejected"];
  const { status } = req.body || {};
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid complaint status." });
  }

  const { data, error } = await supabase
    .from("complaints")
    .update({ status })
    .eq("id", req.params.id)
    .select("*")
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Could not update complaint status." });
  if (!data) return res.status(404).json({ error: "Complaint not found." });
  res.json({ complaint: data });
});

export default router;
