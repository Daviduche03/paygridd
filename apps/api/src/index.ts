import type { inferRouterOutputs } from "@trpc/server";
import { env } from "@/config/env";
import type { AppRouter } from "@/trpc/router";
import { logger } from "@/utils/logger";
import { createApp } from "./app";

export type { AppRouter };
export type RouterOutputs = inferRouterOutputs<AppRouter>;

const app = createApp();

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`🚀 API server running on http://${env.HOST}:${env.PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`${signal} received. Shutting down...`);
  server.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });

  // Force exit after timeout
  setTimeout(() => {
    logger.error("Forcing shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default server;
