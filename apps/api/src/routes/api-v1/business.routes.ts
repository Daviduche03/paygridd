import type { Response } from "express";
import { Router } from "express";
import {
  authenticateApiKey,
  requireScope,
} from "@/middleware/api-key-auth.middleware";
import { businessRepository } from "@/repositories/business.repository";
import { NombaApi } from "@/services/nomba/nomba-api";
import type { AuthenticatedRequest } from "@/types";
import { asyncHandler } from "@/utils/asyncHandler";

const nombaApi = new NombaApi();

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

businessRoutes.get(
  "/balance",
  requireScope("business.read"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const balance = await nombaApi.getParentAccountBalance();
    res.json({
      success: true,
      data: balance ?? { balance: 0, currency: "NGN" },
    });
  }),
);
