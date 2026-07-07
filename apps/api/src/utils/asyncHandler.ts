import type { NextFunction, Request, Response } from "express";
import type { AsyncRequestHandler } from "@/types";

/**
 * Wraps async route handlers so errors are passed to Express error middleware.
 */
export const asyncHandler =
  (fn: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
