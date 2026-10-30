import { supabase } from "../config/supabase.js";

export async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) return res.status(401).json({ error: "Missing bearer access token." });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid or expired access token." });
  }

  req.user = data.user;
  next();
}

export async function requireAdmin(req, res, next) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", req.user.id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Unable to verify administrator role." });
  if (data?.role !== "admin") return res.status(403).json({ error: "Administrator access required." });

  next();
}
