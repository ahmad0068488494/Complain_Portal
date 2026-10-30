import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Expected table: complaints with user_id, title, description, category, status.
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Could not fetch complaints." });
  res.json({ complaints: data });
});

router.post("/", async (req, res) => {
  const { title, description, category } = req.body || {};
  if (![title, description, category].every((value) => typeof value === "string" && value.trim())) {
    return res.status(400).json({ error: "title, description, and category are required." });
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

  if (error) return res.status(500).json({ error: "Could not create complaint." });
  res.status(201).json({ complaint: data });
});

export default router;
