import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const evidenceCategories = new Set([
  "Safety & Security",
  "Food & Canteen",
  "Hostel & Accommodation",
  "Infrastructure & Facilities",
]);

const evidencePathPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i;

router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Student complaints query failed:", error);
    return res.status(500).json({ error: "Could not fetch your complaints." });
  }

  const complaints = await Promise.all((data || []).map(async (item) => {
    if (!item.evidence_path) return { ...item, evidence_signed_url: "" };
    const { data: signed, error: signedError } = await supabase.storage
      .from("complaint-evidence")
      .createSignedUrl(item.evidence_path, 3600);
    return { ...item, evidence_signed_url: signedError ? "" : signed?.signedUrl || "" };
  }));

  res.json({ complaints });
});

router.post("/", async (req, res) => {
  const { title, description, category, evidence_path = null } = req.body || {};
  const normalizedCategory = typeof category === "string" ? category.trim() : "";

  if (
    typeof title !== "string" ||
    title.trim().length < 3 ||
    title.trim().length > 160 ||
    typeof description !== "string" ||
    description.trim().length < 10 ||
    description.trim().length > 10000 ||
    !normalizedCategory ||
    normalizedCategory.length > 80
  ) {
    return res.status(400).json({
      error: "Enter a title (3–160 characters), description (10–10000 characters), and valid category.",
    });
  }

  // Evidence is optional, but a supplied path must belong to the signed-in student.
  if (evidence_path !== null) {
    if (
      typeof evidence_path !== "string" ||
      !evidenceCategories.has(normalizedCategory) ||
      !evidence_path.startsWith(`${req.user.id}/`)
    ) {
      return res.status(400).json({
        error: "Evidence can only be attached to supported categories and must belong to your account.",
      });
    }

    const fileName = evidence_path.slice(req.user.id.length + 1);
    if (!evidencePathPattern.test(fileName)) {
      return res.status(400).json({
        error: "Invalid evidence file path. Upload a valid JPG, PNG or WebP image again.",
      });
    }

    // The service-role client bypasses Storage RLS, so verify the object exists
    // after checking its owner-scoped path before saving it to the complaint.
    const { error: evidenceError } = await supabase.storage
      .from("complaint-evidence")
      .createSignedUrl(evidence_path, 60);

    if (evidenceError) {
      return res.status(400).json({
        error: "Evidence image was not found or could not be verified. Please upload it again.",
      });
    }
  }

  const { data, error } = await supabase
    .from("complaints")
    .insert({
      user_id: req.user.id,
      title: title.trim(),
      description: description.trim(),
      category: normalizedCategory,
      status: "pending",
      evidence_path,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Complaint creation failed:", error);
    return res.status(500).json({ error: "Could not create your complaint." });
  }

  res.status(201).json({ complaint: data });
});

export default router;
