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

  res.json({ complaints: data || [] });
});

router.post("/", async (req, res) => {
  const { title, description, category } = req.body || {};

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

  const { data, error } = await supabase
    .from("complaints")
    .insert({
      user_id: req.user.id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      status: "pending",
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
