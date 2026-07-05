import { Router } from "express";
import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticateApiKey, requireScope } from "@/middleware/api-key-auth.middleware";
import { businessRepository } from "@/repositories/business.repository";

export const businessRoutes = Router();

businessRoutes.use(authenticateApiKey);

businessRoutes.get(
  "/",
  requireScope("business.read"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const business = await businessRepository.findById(businessId);
    if (!business) {
      res.status(404).json({ success: false, error: "Business not found" });
      return;
    }
    res.json({ success: true, data: business });
  }),
);
