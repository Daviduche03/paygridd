import crypto from "node:crypto";
import type { ApiKey } from "@/repositories/api-key.repository";
import { apiKeyRepository } from "@/repositories/api-key.repository";

const WEBHOOK_EVENTS = [
  "payment.received",
  "payment.reversed",
  "payment.failed",
  "invoice.created",
  "invoice.paid",
  "invoice.overdue",
  "reconciliation.completed",
  "customer.created",
  "account.provisioned",
  "account.suspended",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

const KEY_PREFIX = "pg_";

function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = `${KEY_PREFIX}${crypto.randomBytes(32).toString("hex")}`;
  const prefix = raw.slice(0, 10);
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, prefix, hash };
}

function hashKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export const apiKeyService = {
  async list(businessId: string) {
    const keys = await apiKeyRepository.findByBusiness(businessId);
    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      scopes: k.scopes,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      active: k.active,
      createdAt: k.createdAt,
    }));
  },

  async create(data: {
    businessId: string;
    name: string;
    scopes?: string[];
    createdBy?: string;
  }): Promise<{ key: Omit<ApiKey, "keyHash">; rawKey: string }> {
    const { raw, prefix, hash } = generateApiKey();

    const key = await apiKeyRepository.create({
      businessId: data.businessId,
      name: data.name,
      keyPrefix: prefix,
      keyHash: hash,
      scopes: data.scopes,
      createdBy: data.createdBy,
    });

    return { key, rawKey: raw };
  },

  async update(
    businessId: string,
    id: string,
    data: { name?: string; scopes?: string[]; active?: boolean },
  ) {
    const key = await apiKeyRepository.findById(id);
    if (!key || key.businessId !== businessId)
      throw new Error("API key not found");

    return apiKeyRepository.update(id, data);
  },

  async remove(businessId: string, id: string) {
    const key = await apiKeyRepository.findById(id);
    if (!key || key.businessId !== businessId)
      throw new Error("API key not found");

    await apiKeyRepository.remove(id);
    return { success: true };
  },

  // Webhooks
  async listWebhooks(businessId: string) {
    return apiKeyRepository.findWebhooksByBusiness(businessId);
  },

  async getWebhook(businessId: string, id: string) {
    const webhook = await apiKeyRepository.findWebhookById(id);
    if (!webhook || webhook.businessId !== businessId) return null;
    return webhook;
  },

  async createWebhook(data: {
    businessId: string;
    url: string;
    description?: string;
    events: string[];
  }) {
    const signingSecret = crypto.randomBytes(32).toString("hex");
    const webhook = await apiKeyRepository.createWebhook({
      ...data,
      signingSecret,
    });
    return { ...webhook, rawSecret: signingSecret };
  },

  async updateWebhook(
    businessId: string,
    id: string,
    data: {
      url?: string;
      description?: string;
      events?: string[];
      active?: boolean;
    },
  ) {
    const existing = await apiKeyRepository.findWebhookById(id);
    if (!existing || existing.businessId !== businessId)
      throw new Error("Webhook not found");
    return apiKeyRepository.updateWebhook(id, data);
  },

  async removeWebhook(businessId: string, id: string) {
    const existing = await apiKeyRepository.findWebhookById(id);
    if (!existing || existing.businessId !== businessId)
      throw new Error("Webhook not found");
    await apiKeyRepository.removeWebhook(id);
    return { success: true };
  },

  async getDeliveries(businessId: string, webhookId: string) {
    const webhook = await apiKeyRepository.findWebhookById(webhookId);
    if (!webhook || webhook.businessId !== businessId) return [];
    return apiKeyRepository.findDeliveriesByWebhookId(webhookId);
  },

  async validate(rawKey: string): Promise<ApiKey | null> {
    const hash = hashKey(rawKey);
    const key = await apiKeyRepository.findByKeyHash(hash);
    if (!key || !key.active) return null;

    if (key.expiresAt && new Date(key.expiresAt) < new Date()) return null;

    await apiKeyRepository.updateLastUsed(key.id);
    return key;
  },
};
