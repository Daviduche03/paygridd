import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/config/db";
import { customers, invoices, transactions } from "@/db/schema";
import { transactionsService } from "@/services/transactions.service";
import { transactionRepository } from "@/repositories/transaction.repository";
import { businessRepository } from "@/repositories/business.repository";
import { emailService } from "@/services/email.service";
import { getBusinessIdForUser } from "@/utils/business";
import {
  protectedProcedure,
  publicProcedure,
  stubMutation,
  stubQuery,
  t,
} from "@/trpc/init";

const statusSchema = z.enum(["success", "pending", "failed", "reversed"]);
const typeSchema = z.enum(["credit", "debit"]);
const searchFieldSchema = z.enum([
  "reference",
  "customer",
  "account",
  "sender",
]);
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

  list: protectedProcedure
    .input(listInputSchema)
    .query(async ({ ctx, input }) => {
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

  get: protectedProcedure.query(async () => ({
    data: [],
    meta: { cursor: null },
  })),
  getById: protectedProcedure.query(async () => ({ id: "", manual: false })),
  update: publicProcedure
    .input(
      z.object({ id: z.string(), data: z.record(z.string(), z.unknown()) }),
    )
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

  setReconciliationStatus: protectedProcedure
    .input(
      z.object({
        transactionId: z.string(),
        status: z.enum([
          "pending",
          "matched",
          "underpaid",
          "overpaid",
          "duplicate",
          "needs_review",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const businessId = await getBusinessIdForUser(ctx.user.id);
      if (!businessId) throw new Error("Business context required");
      return transactionRepository.setReconciliationStatus(
        businessId,
        input.transactionId,
        input.status,
      );
    }),

  notifyReconciliationCustomer: protectedProcedure
    .input(
      z.object({
        transactionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const businessId = await getBusinessIdForUser(ctx.user.id);
      if (!businessId) throw new Error("Business context required");

      const [row] = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          reconciliationStatus: transactions.reconciliationStatus,
          invoiceId: transactions.invoiceId,
          invoiceNumber: invoices.invoiceNumber,
          invoiceAmount: invoices.amount,
          customerId: transactions.customerId,
          customerName: customers.name,
          customerEmail: customers.email,
          customerBillingEmail: customers.billingEmail,
        })
        .from(transactions)
        .leftJoin(invoices, eq(transactions.invoiceId, invoices.id))
        .leftJoin(customers, eq(transactions.customerId, customers.id))
        .where(
          and(
            eq(transactions.id, input.transactionId),
            eq(transactions.businessId, businessId),
          ),
        )
        .limit(1);

      if (!row) throw new Error("Transaction not found");

      const business = await businessRepository.findById(businessId);
      const customerEmail =
        row.customerBillingEmail ?? row.customerEmail ?? null;

      if (customerEmail && business?.name && row.customerName) {
        await emailService.send({
          to: customerEmail,
          subject: `Payment Update — ${row.reconciliationStatus ?? "Pending"}`,
          html: `
<h2>Payment Update</h2>
<p>Dear ${row.customerName},</p>
<p>Your payment of <strong>${row.amount}</strong> for invoice <strong>${row.invoiceNumber ?? "N/A"}</strong> is currently marked as <strong>${row.reconciliationStatus ?? "pending"}</strong>.</p>
<p>Invoice amount: <strong>${row.invoiceAmount ?? "N/A"}</strong></p>
<p>If you have any questions, please contact ${business.name}.</p>
<hr>
<p style="font-size:12px;color:#94a3b8;">PayGrid — Programmable Accounts Receivable</p>`,
        });
      }

      return { sent: !!customerEmail };
    }),
});
