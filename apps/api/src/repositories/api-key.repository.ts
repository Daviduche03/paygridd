import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/config/db";
import { apiKeys, webhookDeliveries, webhooks } from "@/db/schema";

export interface ApiKey {
  id: string;
  businessId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  active: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const apiKeyRepository = {
  async findByBusiness(businessId: string): Promise<ApiKey[]> {
    const rows = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.businessId, businessId))
      .orderBy(apiKeys.createdAt);

    return rows as ApiKey[];
  },

  async findById(id: string): Promise<ApiKey | null> {
    const [row] = await db.select().from(apiKeys).where(eq(apiKeys.id, id));
    return (row as ApiKey) || null;
  },

  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    const [row] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash));

    return (row as ApiKey) || null;
  },

  async create(data: {
    businessId: string;
    name: string;
    keyPrefix: string;
    keyHash: string;
    scopes?: string[];
    createdBy?: string;
  }): Promise<ApiKey> {
    const [row] = await db
      .insert(apiKeys)
      .values({
        businessId: data.businessId,
        name: data.name,
        keyPrefix: data.keyPrefix,
        keyHash: data.keyHash,
        scopes: data.scopes ?? [],
        createdBy: data.createdBy,
      })
      .returning();

    return row as ApiKey;
  },

  async update(
    id: string,
    data: { name?: string; scopes?: string[]; active?: boolean },
  ): Promise<ApiKey | null> {
    const [row] = await db
      .update(apiKeys)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(apiKeys.id, id))
      .returning();

    return (row as ApiKey) || null;
  },

  async remove(id: string): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  },

  async updateLastUsed(id: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date().toISOString() })
      .where(eq(apiKeys.id, id));
  },

  // Webhooks
  async findWebhooksByBusiness(businessId: string) {
    const rows = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.businessId, businessId))
      .orderBy(webhooks.createdAt);

    return rows;
  },

  async findWebhookById(id: string) {
    const [row] = await db.select().from(webhooks).where(eq(webhooks.id, id));
    return row ?? null;
  },

  async createWebhook(data: {
    businessId: string;
    url: string;
    description?: string;
    events: string[];
    signingSecret: string;
  }) {
    const [row] = await db
      .insert(webhooks)
      .values({
        businessId: data.businessId,
        url: data.url,
        description: data.description ?? "",
        events: data.events,
        signingSecret: data.signingSecret,
      })
      .returning();
    return row;
  },

  async updateWebhook(
    id: string,
    data: {
      url?: string;
      description?: string;
      events?: string[];
      active?: boolean;
    },
  ) {
    const [row] = await db
      .update(webhooks)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(webhooks.id, id))
      .returning();
    return row ?? null;
  },

  async removeWebhook(id: string) {
    await db.delete(webhooks).where(eq(webhooks.id, id));
  },

  // Webhook deliveries
  async findDeliveriesByWebhookId(webhookId: string, limit = 20) {
    const rows = await db
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.webhookId, webhookId))
      .orderBy(desc(webhookDeliveries.createdAt))
      .limit(limit);

    return rows;
  },

  async createWebhookDelivery(data: {
    webhookId: string;
    businessId: string;
    eventType: string;
    payload: unknown;
    status?: string;
  }) {
    const [row] = await db
      .insert(webhookDeliveries)
      .values({
        webhookId: data.webhookId,
        businessId: data.businessId,
        eventType: data.eventType,
        payload: data.payload as any,
        status: (data.status ?? "pending") as any,
      })
      .returning();
    return row;
  },

  async updateWebhookDelivery(
    id: string,
    data: {
      status?: string;
      responseCode?: number | null;
      responseBody?: string | null;
      attempts?: number;
      nextRetryAt?: string | null;
    },
  ) {
    const [row] = await db
      .update(webhookDeliveries)
      .set({ ...data, updatedAt: new Date().toISOString() } as any)
      .where(eq(webhookDeliveries.id, id))
      .returning();
    return row ?? null;
  },

  async findPendingDeliveries(limit = 50) {
    const rows = await db
      .select()
      .from(webhookDeliveries)
      .where(
        or(
          eq(webhookDeliveries.status as any, "pending"),
          eq(webhookDeliveries.status as any, "retrying"),
        ),
      )
      .orderBy(webhookDeliveries.createdAt)
      .limit(limit);

    return rows;
  },
};
