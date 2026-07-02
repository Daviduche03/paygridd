import type { Request, Response } from "express";
import { NombaWebhookError, nombaWebhookService } from "@/services/nomba/webhook.service";
import type { NombaWebhookPayload } from "@/types/nomba-webhook";

function headerValue(req: Request, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export const nombaWebhookController = {
  async handle(req: Request, res: Response) {
    const payload = req.body as NombaWebhookPayload;

    try {
      const result = await nombaWebhookService.processEvent(payload, {
        signature: headerValue(req, "nomba-signature") ?? "",
        timestamp: headerValue(req, "nomba-timestamp") ?? "",
        algorithm: headerValue(req, "nomba-signature-algorithm"),
      });

      res.status(200).json({
        success: true,
        data: {
          requestId: result.requestId,
          status: result.status,
          eventType: result.eventType,
        },
      });
    } catch (error) {
      if (error instanceof NombaWebhookError) {
        res.status(error.status).json({ success: false, error: error.message });
        return;
      }
      throw error;
    }
  },
};
