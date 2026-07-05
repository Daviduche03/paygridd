import { Router } from "express";
import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticateApiKey, requireScope } from "@/middleware/api-key-auth.middleware";
import { apiKeyRepository } from "@/repositories/api-key.repository";
import { apiKeyService } from "@/services/api-key.service";

export const webhooksRoutes = Router();

webhooksRoutes.use(authenticateApiKey);

webhooksRoutes.get(
  "/",
  requireScope("webhook.read"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const webhooks = await apiKeyRepository.findWebhooksByBusiness(businessId);
    const data = webhooks.map((w) => ({
      id: w.id,
      url: w.url,
      description: w.description,
      events: w.events,
      active: w.active,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));
    res.json({ success: true, data });
  }),
);

webhooksRoutes.post(
  "/",
  requireScope("webhook.write"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const { url, description, events } = req.body;
    if (!url) {
      res.status(400).json({ success: false, error: "url is required" });
      return;
    }
    const result = await apiKeyService.createWebhook({
      businessId,
      url,
      description,
      events: events ?? [],
    });
    res.status(201).json({
      success: true,
      data: {
        id: result.id,
        url: result.url,
        description: result.description,
        events: result.events,
        active: result.active,
        signingSecret: result.rawSecret,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    });
  }),
);

webhooksRoutes.get(
  "/:id",
  requireScope("webhook.read"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const id = req.params.id!;
    const webhook = await apiKeyRepository.findWebhookById(id);
    if (!webhook || webhook.businessId !== businessId) {
      res.status(404).json({ success: false, error: "Webhook not found" });
      return;
    }
    res.json({
      success: true,
      data: {
        id: webhook.id,
        url: webhook.url,
        description: webhook.description,
        events: webhook.events,
        active: webhook.active,
        createdAt: webhook.createdAt,
        updatedAt: webhook.updatedAt,
      },
    });
  }),
);

webhooksRoutes.put(
  "/:id",
  requireScope("webhook.write"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const id = req.params.id!;
    const existing = await apiKeyRepository.findWebhookById(id);
    if (!existing || existing.businessId !== businessId) {
      res.status(404).json({ success: false, error: "Webhook not found" });
      return;
    }
    const { url, description, events, active } = req.body;
    const updated = await apiKeyRepository.updateWebhook(id, {
      url, description, events, active,
    });
    res.json({ success: true, data: updated });
  }),
);

webhooksRoutes.delete(
  "/:id",
  requireScope("webhook.write"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const id = req.params.id!;
    const existing = await apiKeyRepository.findWebhookById(id);
    if (!existing || existing.businessId !== businessId) {
      res.status(404).json({ success: false, error: "Webhook not found" });
      return;
    }
    await apiKeyRepository.removeWebhook(id);
    res.json({ success: true, data: { id } });
  }),
);
