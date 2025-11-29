// Prefer explicit env; fallback aligns with backend default PORT in .env (5000)
export const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";
