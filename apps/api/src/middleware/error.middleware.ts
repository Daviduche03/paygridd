import type { ErrorRequestHandler, Request, Response } from "express";
import { logger } from "@/utils/logger";

export const errorHandler: ErrorRequestHandler = (
  err: Error & { status?: number; statusCode?: number },
  req: Request,
  res: Response,
  _next: any
) => {
  const status = err.status || err.statusCode || 500;

  const cause = (err as any).cause;
  logger.error("Request error", {
    error: err.message,
    cause: cause ? (cause instanceof Error ? cause.message : cause) : undefined,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(status).json({
    success: false,
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
