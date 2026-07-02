import { eq } from "drizzle-orm";
import { db } from "@/config/db";
import { webhookEvents } from "@/db/schema";

type CreateWebhookEventParams = {
  businessId?: string | null;
  requestId: string;
  eventType: string;
  payload: unknown;
  transactionId?: string | null;
};

export const webhookEventRepository = {
  async exists(requestId: string) {
    const [row] = await db
      .select({ id: webhookEvents.id })
      .from(webhookEvents)
      .where(eq(webhookEvents.requestId, requestId))
      .limit(1);

    return !!row;
  },

  async create(params: CreateWebhookEventParams) {
    const [created] = await db
      .insert(webhookEvents)
      .values({
        businessId: params.businessId ?? null,
        requestId: params.requestId,
        eventType: params.eventType,
        payload: params.payload,
        transactionId: params.transactionId ?? null,
      })
      .returning();

    return created;
  },
};
