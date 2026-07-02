import { Router } from "express";
import { nombaWebhookController } from "@/controllers/nomba-webhook.controller";
import { asyncHandler } from "@/utils/asyncHandler";

export const webhooksRoutes = Router();

webhooksRoutes.post("/nomba", asyncHandler(nombaWebhookController.handle));
