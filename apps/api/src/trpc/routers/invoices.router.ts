import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { invoiceService } from "@/services/invoice.service";
import { protectedProcedure, publicProcedure, stubMutation, stubQuery, t } from "@/trpc/init";

const statusSchema = z.enum([
  "draft",
  "scheduled",
  "unpaid",
  "overdue",
  "paid",
  "canceled",
  "refunded",
]);

const dueFilterSchema = z.enum(["overdue", "week", "month"]);

const listInputSchema = z
  .object({
    q: z.string().nullish(),
    statuses: z.array(z.string()).nullish(),
    customers: z.array(z.string().uuid()).nullish(),
    start: z.string().nullish(),
    end: z.string().nullish(),
    dueFilter: dueFilterSchema.nullish(),
    sort: z.array(z.string()).nullish(),
    pageSize: z.coerce.number().nullish(),
    cursor: z.string().nullish(),
  })
  .nullish();

const invoiceDraftInputSchema = z.record(z.string(), z.unknown());

const createInputSchema = z.object({
  id: z.string().uuid(),
  deliveryType: z
    .enum(["create", "create_and_send", "scheduled", "recurring"])
    .optional(),
  scheduledAt: z.string().optional(),
});

const updateInputSchema = z
  .object({
    id: z.string().uuid(),
  })
  .passthrough();

export const invoicesRouter = t.router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    return invoiceService.summary(ctx.user.id);
  }),

  get: protectedProcedure.input(listInputSchema).query(async ({ ctx, input }) => {
    return invoiceService.list({
      userId: ctx.user.id,
      pageSize: input?.pageSize ?? 50,
      cursor: input?.cursor,
      q: input?.q,
      statuses: input?.statuses,
      customers: input?.customers,
      start: input?.start,
      end: input?.end,
      dueFilter: input?.dueFilter ?? null,
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return invoiceService.getById(ctx.user.id, input.id);
    }),

  defaultSettings: protectedProcedure
    .input(z.object({ businessId: z.string().optional() }).optional())
    .query(async ({ ctx }) => {
      return invoiceService.defaultSettings(ctx.user.id);
    }),

  invoiceSummary: protectedProcedure
    .input(
      z
        .object({
          businessId: z.string().optional(),
          statuses: z.array(statusSchema).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return invoiceService.invoiceSummary(ctx.user.id, input?.statuses ?? null);
    }),

  paymentStatus: protectedProcedure.query(async () => ({ score: 0, status: "neutral" })),

  draft: protectedProcedure
    .input(invoiceDraftInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await invoiceService.saveDraft(ctx.user.id, input);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to save draft",
        });
      }
    }),

  create: protectedProcedure
    .input(createInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await invoiceService.finalizeDraft(ctx.user.id, input);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to create invoice",
        });
      }
    }),

  update: protectedProcedure
    .input(updateInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        return await invoiceService.update(ctx.user.id, id, data);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to update invoice",
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return invoiceService.delete(ctx.user.id, input.id);
    }),

  remind: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async () => ({ success: true })),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async () => ({ id: "stub" })),

  cancelSchedule: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async () => ({ success: true })),

  getInvoiceByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      return invoiceService.getByToken(input.token);
    }),

  mostActiveClient: protectedProcedure
    .input(z.object({ businessId: z.string().optional() }).optional())
    .query(async () => null),

  inactiveClientsCount: protectedProcedure
    .input(z.object({ businessId: z.string().optional() }).optional())
    .query(async () => 0),

  topRevenueClient: protectedProcedure
    .input(z.object({ businessId: z.string().optional() }).optional())
    .query(async () => null),

  newCustomersCount: protectedProcedure
    .input(z.object({ businessId: z.string().optional() }).optional())
    .query(async () => 0),

  createFromTracker: protectedProcedure
    .input(z.object({ businessId: z.string(), projectIds: z.array(z.string()) }))
    .mutation(async () => ({ id: "stub" })),

  searchInvoiceNumber: protectedProcedure
    .input(
      z.object({
        businessId: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return invoiceService.searchInvoiceNumber(ctx.user.id, input.search);
    }),
});
