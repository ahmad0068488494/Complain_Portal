import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import complaintRoutes from "./routes/complaints.js";
import adminRoutes from "./routes/admin.js";
import publicRoutes from "./routes/public.js";
import { createRateLimiter } from "./middleware/rateLimit.js";

const app = express();
const port = Number(process.env.PORT) || 5000;
const allowedOrigins = new Set(
  (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

// Render sits behind a reverse proxy; trust its first forwarded hop for client IPs.
app.set("trust proxy", 1);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  },
}));
app.use(express.json({ limit: "1mb" }));
app.use("/api", createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 300,
  message: "Too many API requests. Please wait and try again.",
}));

const apiStatus = (_req, res) => {
  res.json({
    status: "ok",
    service: "complaint-portal-api",
    message: "Complaint Portal API is running.",
    health: "/api/health",
  });
};

app.get("/", apiStatus);
app.get("/api/health", apiStatus);

app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "API route not found.", path: req.path });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled API error:", err);
  res.status(500).json({ error: "Unexpected server error." });
});

app.listen(port, () => {
  console.log(`Complaint Portal API listening on port ${port}`);
});
