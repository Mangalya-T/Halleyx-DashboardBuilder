import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import apiRoutes from "./backend/routes/api.ts";
import { connectDB } from "./backend/models/schemas.ts";

dotenv.config();

const app = express();

//  IMPORTANT: Render uses dynamic PORT
const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;

//  Connect DB (with error handling)
connectDB()
  .then(() => console.log("MongoDB Connected successfully"))
  .catch((err) => {
    console.error("MongoDB Connection Failed:", err);
    process.exit(1); // stop app if DB fails
  });

//  Middleware
app.use(cors());
app.use(express.json());

//  API Routes
app.use("/api", apiRoutes);

//  Health Check (VERY IMPORTANT for Render)
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Halleyx API is running" });
});

//  404 for API
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.originalUrl}` });
});

//  Serve frontend (production)
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});