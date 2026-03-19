import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import cors from "cors";
import apiRoutes from "./backend/routes/api.ts";
import { connectDB } from "./backend/models/schemas.ts";

dotenv.config();

async function startServer() {
  // Start DB connection in background, don't block server start
  connectDB();
  
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use("/api", apiRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Halleyx API is running" });
  });

  // 404 for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ message: `API route not found: ${req.originalUrl}` });
  });

  // Log registered routes
  console.log("Registered API routes:");
  (apiRoutes as any).stack.forEach((r: any) => {
    if (r.route && r.route.path) {
      console.log(`- ${Object.keys(r.route.methods).join(',').toUpperCase()} /api${r.route.path}`);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Halleyx Server running on http://localhost:${PORT}`);
  });
}

startServer();
