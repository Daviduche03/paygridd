import type { NextFunction, Response } from "express";
import { apiKeyService } from "@/services/api-key.service";
import type { AuthenticatedRequest } from "@/types";
import { asyncHandler } from "@/utils/asyncHandler";

export const authenticateApiKey = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Missing or invalid Authorization header",
      });
      return;
    }

    const rawKey = authHeader.slice(7);
    const key = await apiKeyService.validate(rawKey);
    if (!key) {
      res
        .status(401)
        .json({ success: false, error: "Invalid or expired API key" });
      return;
    }

    req.apiKey = {
      keyId: key.id,
      businessId: key.businessId,
      scopes: key.scopes,
    };

    next();
  },
);

export const requireScope = (...scopes: string[]) =>
  asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const { scopes: keyScopes } = req.apiKey!;
      if (keyScopes.length === 0) {
        next();
        return;
      }
      const hasScope = scopes.some((s) => keyScopes.includes(s));
      if (!hasScope) {
        res.status(403).json({
          success: false,
          error: `Missing required scope. Need one of: ${scopes.join(", ")}`,
        });
        return;
      }
      next();
    },
  );
