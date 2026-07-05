import { z } from "zod";
import { transactionsService } from "@/services/transactions.service";
import { protectedProcedure, publicProcedure, stubMutation, stubQuery, t } from "@/trpc/init";

const statusSchema = z.enum(["success", "pending", "failed", "reversed"]);
const typeSchema = z.enum(["credit", "debit"]);
const searchFieldSchema = z.enum(["reference", "customer", "account", "sender"]);
const reconciliationSchema = z.enum([
  "pending",
  "matched",
  "underpaid",
  "overpaid",
  "duplicate",
  "needs_review",
]);
const dateRangeSchema = z.enum(["all", "today", "7d", "30d", "90d"]);
const amountRangeSchema = z.enum([
  "all",
  "0-1000",
  "1000-10000",
  "10000-100000",
  "100000+",
]);

const listInputSchema = z
  .object({
    q: z.string().nullish(),
    searchField: searchFieldSchema.nullish(),
    status: statusSchema.nullish(),
    type: typeSchema.nullish(),
    customerId: z.string().uuid().nullish(),
    virtualAccountId: z.string().uuid().nullish(),
    reconciliationStatus: reconciliationSchema.nullish(),
    dateRange: dateRangeSchema.nullish(),
    amountRange: amountRangeSchema.nullish(),
    pageSize: z.coerce.number().nullish(),
    cursor: z.string().nullish(),
    limit: z.coerce.number().nullish(),
    offset: z.coerce.number().nullish(),
  })
  .nullish();

export const transactionsRouter = t.router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    return transactionsService.summary(ctx.user.id);
  }),

  reconciliationSummary: protectedProcedure.query(async ({ ctx }) => {
    return transactionsService.reconciliationSummary(ctx.user.id);
  }),

  list: protectedProcedure.input(listInputSchema).query(async ({ ctx, input }) => {
    if (input?.limit != null || input?.offset != null) {
      return transactionsService.listRecent({
        userId: ctx.user.id,
        limit: input?.limit ?? 50,
        offset: input?.offset ?? 0,
      });
    }

    return transactionsService.list({
      userId: ctx.user.id,
      pageSize: input?.pageSize ?? 50,
      cursor: input?.cursor,
      q: input?.q,
      searchField: input?.searchField ?? null,
      status: input?.status ?? null,
      type: input?.type ?? null,
      customerId: input?.customerId ?? null,
      virtualAccountId: input?.virtualAccountId ?? null,
      reconciliationStatus: input?.reconciliationStatus ?? null,
      dateRange: input?.dateRange ?? null,
      amountRange: input?.amountRange ?? null,
    });
  }),

  get: protectedProcedure.query(async () => ({ data: [], meta: { cursor: null } })),
  getById: protectedProcedure.query(async () => ({ id: "", manual: false })),
  update: publicProcedure
    .input(z.object({ id: z.string(), data: z.record(z.string(), z.unknown()) }))
    .mutation(async () => ({ success: true })),
  create: stubMutation(),
  deleteMany: stubMutation(),
  export: stubMutation(),
  generateCsvMapping: stubMutation(),
  getReviewCount: stubQuery(),
  getSimilarTransactions: stubQuery(),
  import: stubMutation(),
  moveToReview: stubMutation(),
  searchTransactionMatch: stubQuery(),
  updateMany: stubMutation(),
});
