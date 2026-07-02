import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "@/types";
import { logger } from "@/utils/logger";
import { verifyToken } from "@/utils/jwt";

/**
 * JWT auth middleware (replaces Supabase).
 * Expects Authorization: Bearer <jwt> or cookie 'token'
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies) {
    const cookies = req.cookies as Record<string, string | undefined>;
    token = cookies["auth-token"] ?? cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, error: "Missing or invalid Authorization header" });
  }

  const payload = verifyToken(token);

  if (!payload) {
    logger.warn("Invalid JWT");
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  req.user = {
    id: payload.userId,
    email: payload.email,
  };

  next();
}


