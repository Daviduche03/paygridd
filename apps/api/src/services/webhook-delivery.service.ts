import crypto from "node:crypto";
import { apiKeyRepository } from "@/repositories/api-key.repository";

const RETRY_DELAYS = [60, 300, 900, 3600, 14400]; // 1min, 5min, 15min, 1hr, 4hr
const MAX_PAYLOAD_SIZE = 256 * 1024; // 256KB

function signPayload(payload: unknown, secret: string): string {
  const body = JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

export const webhookDeliveryService = {
  async deliver(webhookId: string, eventType: string, payload: unknown) {
    const webhook = await apiKeyRepository.findWebhookById(webhookId);
    if (!webhook || !webhook.active) return null;

    const body = JSON.stringify(payload);
    if (body.length > MAX_PAYLOAD_SIZE) {
      throw new Error("Payload exceeds maximum size of 256KB");
    }

    const signature = signPayload(payload, webhook.signingSecret);
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const delivery = await apiKeyRepository.createWebhookDelivery({
      webhookId: webhook.id,
      businessId: webhook.businessId,
      eventType,
      payload,
    });

    if (!delivery) return { success: false };

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "paygrid-signature": signature,
          "paygrid-timestamp": timestamp,
          "User-Agent": "PayGrid-Webhook/1.0",
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });

      await apiKeyRepository.updateWebhookDelivery(delivery.id, {
        status: response.ok ? "delivered" : "failed",
        responseCode: response.status,
        responseBody: await response.text().catch(() => null),
        attempts: 1,
      });

      if (response.ok) return { success: true };

      if (response.status >= 400 && response.status < 500) {
        return { success: false, permanentFailure: true };
      }

      return { success: false, shouldRetry: true };
    } catch (error) {
      const attempts = 1;
      const maxAttempts = 5;
      const delay = RETRY_DELAYS[0] ?? 60;

      const shouldRetry = attempts < maxAttempts;
      await apiKeyRepository.updateWebhookDelivery(delivery.id, {
        status: shouldRetry ? "retrying" : "failed",
        responseCode: null,
        responseBody:
          error instanceof Error ? error.message : "Connection failed",
        attempts,
        nextRetryAt: shouldRetry
          ? new Date(Date.now() + delay * 1000).toISOString()
          : null,
      });

      return { success: false, shouldRetry };
    }
  },

  async deliverToAllSubscribers(
    businessId: string,
    eventType: string,
    payload: unknown,
  ) {
    const webhooks = await apiKeyRepository.findWebhooksByBusiness(businessId);
    const active = webhooks.filter(
      (w) => w.active && w.events.includes(eventType),
    );

    const results = await Promise.allSettled(
      active.map((w) => this.deliver(w.id, eventType, payload)),
    );

    return results.map((r, i) => ({
      webhookId: active[i]?.id,
      status: r.status === "fulfilled" ? r.value : { success: false },
    }));
  },

  async retryPending() {
    const deliveries = await apiKeyRepository.findPendingDeliveries();
    const now = Date.now();

    for (const delivery of deliveries) {
      if (
        delivery.nextRetryAt &&
        new Date(delivery.nextRetryAt).getTime() > now
      ) {
        continue;
      }

      const webhook = await apiKeyRepository.findWebhookById(
        delivery.webhookId,
      );
      if (!webhook || !webhook.active) continue;

      try {
        const body = JSON.stringify(delivery.payload);
        const signature = signPayload(delivery.payload, webhook.signingSecret);
        const timestamp = Math.floor(Date.now() / 1000).toString();

        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "paygrid-signature": signature,
            "paygrid-timestamp": timestamp,
            "User-Agent": "PayGrid-Webhook/1.0",
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });

        await apiKeyRepository.updateWebhookDelivery(delivery.id, {
          status: response.ok ? "delivered" : "failed",
          responseCode: response.status,
          responseBody: await response.text().catch(() => null),
          attempts: (delivery.attempts ?? 0) + 1,
        });

        if (response.ok) continue;

        if (response.status >= 400 && response.status < 500) continue;
      } catch {
        // ignore
      }

      const attempts = (delivery.attempts ?? 0) + 1;
      const maxAttempts = delivery.maxAttempts ?? 5;
      const delayIdx = Math.min(attempts - 1, RETRY_DELAYS.length - 1);
      const delay = RETRY_DELAYS[delayIdx] ?? 14400;

      await apiKeyRepository.updateWebhookDelivery(delivery.id, {
        status: attempts >= maxAttempts ? "failed" : "retrying",
        attempts,
        nextRetryAt: new Date(Date.now() + delay * 1000).toISOString(),
      });
    }
  },
};
