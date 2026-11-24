import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get(
  "/track/:referenceId",
  createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    message: "Too many tracking attempts. Please wait 15 minutes and try again.",
  }),
  async (req, res) => {
    const referenceId = String(req.params.referenceId || "").trim().toUpperCase();
    // Accept existing 8-hex IDs during transition and new 32-hex IDs.
    if (!/^CP-\d{4}-(?:[A-F0-9]{8}|[A-F0-9]{32})$/.test(referenceId)) {
      return res.status(404).json({ error: "Complaint not found." });
    }
    const { data, error } = await supabase.rpc(
      "track_complaint_by_reference",
      { p_reference_id: referenceId },
    );
    if (error) {
      console.error("Public complaint tracking failed:", error);
      return res.status(503).json({
        error: "Complaint tracking is temporarily unavailable. Please try again later.",
      });
    }
    const complaint = Array.isArray(data) ? data[0] : data;
    if (!complaint) return res.status(404).json({ error: "Complaint not found." });
    res.set("Cache-Control", "no-store");
    return res.json({ complaint });
  },
);

export default router;
