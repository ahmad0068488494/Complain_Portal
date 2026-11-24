// Lightweight fixed-window limiter for the single-instance Render deployment.
// Use a shared store (for example Redis) before running multiple API instances.
export function createRateLimiter({ windowMs, maxRequests, message = "Too many requests. Please try again later." }) {
  const clients = new Map();
  let requestsSinceCleanup = 0;
  return (req, res, next) => {
    const now = Date.now();
    const clientKey = req.ip || req.socket.remoteAddress || "unknown";
    let entry = clients.get(clientKey);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      clients.set(clientKey, entry);
    }
    entry.count += 1;
    const remaining = Math.max(0, maxRequests - entry.count);
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    res.set("RateLimit-Limit", String(maxRequests));
    res.set("RateLimit-Remaining", String(remaining));
    res.set("RateLimit-Reset", String(retryAfter));
    if (entry.count > maxRequests) {
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({ error: message });
    }
    requestsSinceCleanup += 1;
    if (requestsSinceCleanup >= 1000 || clients.size > 10000) {
      for (const [key, value] of clients) if (value.resetAt <= now) clients.delete(key);
      requestsSinceCleanup = 0;
    }
    next();
  };
}
