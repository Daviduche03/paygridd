import { existsSync } from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { env } from "@/config/env";
import { errorHandler } from "@/middleware/error.middleware";
import { logger } from "@/utils/logger";
import { appRouter } from "@/trpc/router";
import { createContext } from "@/trpc/context";
import { authRoutes } from "@/routes/auth.routes";
import { filesRoutes } from "@/routes/files.routes";
import { webhooksRoutes } from "@/routes/webhooks.routes";

export function createApp() {
  const app = express();

  // Serve frontend static files in production
  const frontendDist = path.resolve(__dirname, "../../dashboard-react/dist");
  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    logger.info(`Serving frontend from ${frontendDist}`);
  }

  // Security + basics
  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Request logger (simple)
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });

  // Health check (before routes)
  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
  });

  app.use("/auth", authRoutes);
  app.use("/files", filesRoutes);
  app.use("/webhooks", webhooksRoutes);

  // tRPC — all API business logic
  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  // SPA fallback — serve index.html for non-API GET requests
  if (existsSync(frontendDist)) {
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/trpc") || req.path.startsWith("/auth") || req.path.startsWith("/api") || req.path.startsWith("/webhooks") || req.path.startsWith("/files") || req.path.startsWith("/health")) {
        return next();
      }
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  }

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: "Route not found",
      path: req.originalUrl,
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
