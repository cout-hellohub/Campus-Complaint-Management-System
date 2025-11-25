import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import { dirname } from "path";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from backend/.env explicitly so running node from repo root works.
dotenv.config({ path: path.join(__dirname, '.env') });
const app = express();

// Official CORS setup
const isProduction = process.env.NODE_ENV === 'production';

// In production, only use environment variables for CORS
// In development, allow localhost origins
const defaultAllowedOrigins = isProduction ? [] : [
  "http://localhost:5175", // Vite dev (current port)
  "http://localhost:5174",
  "http://localhost:5173", // React dev server
  "http://localhost:3000", // Alternate React port
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

if (process.env.FRONTEND_URL) {
  defaultAllowedOrigins.push(process.env.FRONTEND_URL);
}

const envAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];

// Allow additional origin provided via FRONTEND_URL or FRONTEND_ORIGIN env var
const extraOrigins = [];
if (process.env.FRONTEND_URL) extraOrigins.push(process.env.FRONTEND_URL.trim());
if (process.env.FRONTEND_ORIGIN) extraOrigins.push(process.env.FRONTEND_ORIGIN.trim());

const allowedOrigins = Array.from(
  new Set([...defaultAllowedOrigins, ...envAllowedOrigins, ...extraOrigins])
).filter(Boolean);

// In production, require at least one origin to be configured
if (isProduction && allowedOrigins.length === 0) {
  console.warn('⚠️  WARNING: No CORS origins configured for production. Set FRONTEND_URL or CORS_ALLOWED_ORIGINS environment variable.');
}


app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true, // Allow Authorization headers and cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

//  JSON & URL parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  MongoDB connection
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error(" MONGO_URI missing in .env file");
  process.exit(1);
}

mongoose
  .connect(mongoURI)
  .then(() => console.log(" MongoDB connected..."))
  .catch((err) => {
    console.error(" MongoDB connection failed:", err);
    process.exit(1);
  });

//  Routes
app.get("/", (req, res) => {
  res.send("Backend running successfully ");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/committee-analytics', analyticsRoutes);
app.use("/api/reports", reportRoutes);

//  Centralized Multer and file upload error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File is too large. 10MB limit." });
  }

  if (
    err?.code === "INVALID_FILE_TYPE" ||
    err?.message ===
      "Invalid file type. Only JPG, PNG, MP4, and MOV are allowed."
  ) {
    return res.status(400).json({
      message: "Invalid file type. Only JPG, PNG, MP4, and MOV are allowed.",
    });
  }

  if (err?.code === "UNAUTHENTICATED_UPLOAD") {
    return res.status(401).json({
      message: err.message || "Not authorized. Please log in to upload files.",
    });
  }

  return next(err);
});

//  Fallback global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err?.stack || err);
  try {
    const timestamp = new Date().toISOString();
    const serialized =
      typeof err === "object"
        ? JSON.stringify(
            {
              message: err.message,
              stack: err.stack,
              name: err.name,
            },
            null,
            2
          )
        : String(err);
    const logEntry = `\n[${timestamp}] ${serialized}`;
    fs.appendFileSync(path.join(__dirname, "error.log"), logEntry, {
      encoding: "utf8",
    });
  } catch (fileErr) {
    console.error("Failed to write error log:", fileErr);
  }
  res.status(500).json({ message: "Internal server error" });
});

// Export app for Vercel serverless functions
export default app;

// Start server only if not in Vercel serverless environment
// Vercel sets VERCEL environment variable
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () =>
    console.log(` Server running at http://localhost:${PORT}`)
  );
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `\n[${timestamp}] Uncaught Exception: ${err.stack || err}`;
    fs.appendFileSync(path.join(__dirname, "error.log"), logEntry, {
      encoding: "utf8",
    });
  } catch (fileErr) {
    console.error("Failed to write uncaught error log:", fileErr);
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `\n[${timestamp}] Unhandled Rejection: ${reason}`;
    fs.appendFileSync(path.join(__dirname, "error.log"), logEntry, {
      encoding: "utf8",
    });
  } catch (fileErr) {
    console.error("Failed to write unhandled rejection log:", fileErr);
  }
  // ⚠️ DO NOT exit server on unhandled rejection in development
  // Only exit in production if critical
  if (process.env.NODE_ENV === 'production') {
    console.error('🔴 Exiting due to unhandled rejection in production');
    process.exit(1);
  }
});
