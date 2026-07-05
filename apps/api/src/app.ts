import { existsSync } from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { env } from "@/config/env";
import { errorHandler } from "@/middleware/error.middleware";
import { logger } from "@/utils/logger";
import { appRouter } from "@/trpc/router";
import { createContext } from "@/trpc/context";
import { authRoutes } from "@/routes/auth.routes";
import { filesRoutes } from "@/routes/files.routes";
import { webhooksRoutes } from "@/routes/webhooks.routes";
import { apiV1Routes } from "@/routes/api-v1.routes";

export function createApp() {
  const app = express();

  // Serve frontend static files in production
  const frontendDist = path.resolve(__dirname, "../../dashboard-react/dist");
  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    logger.info(`Serving frontend from ${frontendDist}`);
  }

  // Security headers
  app.use(helmet());

  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many requests, please try again later" },
  });
  app.use("/trpc", apiLimiter);
  app.use("/api", apiLimiter);

  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many requests, please try again later" },
  });
  app.use("/auth", authLimiter);

  // CORS
  const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
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

  // Serve docs static files
  const docsDist = path.resolve(__dirname, "../../docs/dist");
  if (existsSync(docsDist)) {
    app.use("/docs", express.static(docsDist));
    logger.info(`Serving docs from ${docsDist}`);
  }

  // Docs SPA fallback
  app.get("/docs/*", (req, res, next) => {
    if (existsSync(docsDist)) {
      res.sendFile(path.join(docsDist, "index.html"));
    } else {
      next();
    }
  });

  // Health check (before routes)
  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
  });

  app.use("/auth", authRoutes);
  app.use("/files", filesRoutes);
  app.use("/webhooks", webhooksRoutes);
  app.use("/api/v1", apiV1Routes);

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
      if (req.path.startsWith("/trpc") || req.path.startsWith("/auth") || req.path.startsWith("/api") || req.path.startsWith("/webhooks") || req.path.startsWith("/files") || req.path.startsWith("/docs") || req.path.startsWith("/health")) {
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
