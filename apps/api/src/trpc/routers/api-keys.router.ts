import { z } from "zod";
import { roleProtectedProcedure, t } from "@/trpc/init";
import { apiKeyService } from "@/services/api-key.service";

const scopeSchema = z.enum([
  "transactions.read",
  "transactions.write",
  "invoices.read",
  "invoices.write",
  "customers.read",
  "customers.write",
  "business.read",
  "business.write",
  "webhook.read",
  "webhook.write",
]);

const webhookEventSchema = z.enum([
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
]);

export const apiKeysRouter = t.router({
  // API Keys
  list: roleProtectedProcedure("owner", "admin").query(async ({ ctx }) => {
    return apiKeyService.list(ctx.businessId!);
  }),

  create: roleProtectedProcedure("owner", "admin")
    .input(
      z.object({
        name: z.string().min(1),
        scopes: z.array(scopeSchema).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return apiKeyService.create({
        businessId: ctx.businessId!,
        name: input.name,
        scopes: input.scopes,
        createdBy: ctx.user.id,
      });
    }),

  update: roleProtectedProcedure("owner", "admin")
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        scopes: z.array(scopeSchema).optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return apiKeyService.update(ctx.businessId!, input.id, {
        name: input.name,
        scopes: input.scopes,
        active: input.active,
      });
    }),

  remove: roleProtectedProcedure("owner", "admin")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return apiKeyService.remove(ctx.businessId!, input.id);
    }),

  // Webhooks
  webhooks: roleProtectedProcedure("owner", "admin").query(async ({ ctx }) => {
    return apiKeyService.listWebhooks(ctx.businessId!);
  }),

  getWebhook: roleProtectedProcedure("owner", "admin")
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return apiKeyService.getWebhook(ctx.businessId!, input.id);
    }),

  createWebhook: roleProtectedProcedure("owner", "admin")
    .input(
      z.object({
        url: z.string().url(),
        description: z.string().optional(),
        events: z.array(webhookEventSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return apiKeyService.createWebhook({
        businessId: ctx.businessId!,
        url: input.url,
        description: input.description,
        events: input.events,
      });
    }),

  updateWebhook: roleProtectedProcedure("owner", "admin")
    .input(
      z.object({
        id: z.string(),
        url: z.string().url().optional(),
        description: z.string().optional(),
        events: z.array(webhookEventSchema).optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return apiKeyService.updateWebhook(ctx.businessId!, input.id, {
        url: input.url,
        description: input.description,
        events: input.events,
        active: input.active,
      });
    }),

  removeWebhook: roleProtectedProcedure("owner", "admin")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return apiKeyService.removeWebhook(ctx.businessId!, input.id);
    }),

  webhookDeliveries: roleProtectedProcedure("owner", "admin")
    .input(z.object({ webhookId: z.string() }))
    .query(async ({ ctx, input }) => {
      return apiKeyService.getDeliveries(ctx.businessId!, input.webhookId);
    }),
});
