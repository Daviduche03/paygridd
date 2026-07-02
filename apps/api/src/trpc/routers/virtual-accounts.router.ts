import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { virtualAccountRepository } from "@/repositories/virtual-account.repository";
import { transactionRepository } from "@/repositories/transaction.repository";
import { virtualAccountService } from "@/services/virtual-account.service";
import { getBusinessIdForUser } from "@/utils/business";
import { protectedProcedure, t } from "@/trpc/init";

const statusSchema = z.enum(["active", "suspended", "closed", "expired"]);

export const virtualAccountsRouter = t.router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    const businessId = await getBusinessIdForUser(ctx.user.id);
    if (!businessId) {
      return {
        totalCount: 0,
        activeCount: 0,
        suspendedCount: 0,
        inflowToday: 0,
        currency: "NGN",
      };
    }
    return virtualAccountRepository.getPageSummary(businessId);
  }),

  list: protectedProcedure
    .input(
      z
        .object({
          q: z.string().nullish(),
          status: statusSchema.nullish(),
          customerId: z.string().uuid().nullish(),
          pageSize: z.coerce.number().nullish(),
          cursor: z.string().nullish(),
        })
        .nullish(),
    )
    .query(async ({ ctx, input }) => {
      const businessId = await getBusinessIdForUser(ctx.user.id);
      if (!businessId) {
        return { data: [], meta: { cursor: null } };
      }

      return virtualAccountRepository.list({
        businessId,
        q: input?.q,
        status: input?.status ?? null,
        customerId: input?.customerId ?? null,
        pageSize: input?.pageSize ?? 50,
        cursor: input?.cursor,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const businessId = await getBusinessIdForUser(ctx.user.id);
      if (!businessId) return null;
      return virtualAccountRepository.findById(businessId, input.id);
    }),

  transactions: protectedProcedure
    .input(z.object({ virtualAccountId: z.string().uuid(), limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const businessId = await getBusinessIdForUser(ctx.user.id);
      if (!businessId) return [];

      return transactionRepository.listByVirtualAccount({
        businessId,
        virtualAccountId: input.virtualAccountId,
        limit: input.limit ?? 50,
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        customerId: z.string().uuid().optional().nullable(),
        accountName: z.string().min(1),
        accountRef: z.string().optional(),
        expectedAmount: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const businessId = await getBusinessIdForUser(ctx.user.id);
      if (!businessId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Business required" });
      }

      const accountRef = input.accountRef?.trim() || `pg-${crypto.randomUUID()}`;

      const created = input.customerId
        ? await virtualAccountService.createStaticForCustomer({
            businessId,
            customerId: input.customerId,
            customerName: input.accountName,
          })
        : await virtualAccountService.create({
            businessId,
            customerId: null,
            accountRef,
            accountName: input.accountName,
            expectedAmount: input.expectedAmount,
          });

      if (!created?.id) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create virtual account" });
      }

      return virtualAccountRepository.findById(businessId, created.id);
    }),
});
