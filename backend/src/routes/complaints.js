import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

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
  const evidenceCategories = [
    "Safety & Security",
    "Food & Canteen",
    "Hostel & Accommodation",
    "Infrastructure & Facilities",
  ];

  if (
    typeof title !== "string" ||
    title.trim().length < 3 ||
    title.trim().length > 160 ||
    typeof description !== "string" ||
    description.trim().length < 10 ||
    description.trim().length > 10000 ||
    typeof category !== "string" ||
    category.trim().length < 2 ||
    category.trim().length > 80
  ) {
    return res.status(400).json({
      error: "Enter a title (3–160 characters), description (10–10000 characters), and valid category.",
    });
  }

  if (evidence_path !== null) {
    const parts = typeof evidence_path === "string" ? evidence_path.split("/") : [];
    const validFileName = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i;
    if (
      !evidenceCategories.includes(category.trim()) ||
      parts.length !== 2 ||
      parts[0] !== req.user.id ||
      !validFileName.test(parts[1])
    ) {
      return res.status(400).json({ error: "Image evidence is not valid for this grievance category." });
    }
  }

  const { data, error } = await supabase
    .from("complaints")
    .insert({
      user_id: req.user.id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
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
