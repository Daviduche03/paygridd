import { z } from "zod";
import { statementRepository } from "@/repositories/statement.repository";
import { protectedProcedure, t } from "@/trpc/init";
import { getBusinessIdForUser } from "@/utils/business";

export const statementsRouter = t.router({
  list: protectedProcedure
    .input(
      z.object({
        customerId: z.string().uuid(),
        pageSize: z.number().optional(),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const businessId = await getBusinessIdForUser(ctx.user.id);
      if (!businessId) return [];

      return statementRepository.list({
        businessId,
        customerId: input.customerId,
        pageSize: input.pageSize,
        cursor: input.cursor,
      });
    }),

  generate: protectedProcedure
    .input(
      z.object({
        customerId: z.string().uuid(),
        periodStart: z.string(),
        periodEnd: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const businessId = await getBusinessIdForUser(ctx.user.id);
      if (!businessId) {
        throw new Error("Business not found");
      }

      return statementRepository.generate({
        businessId,
        customerId: input.customerId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
      });
    }),
});
