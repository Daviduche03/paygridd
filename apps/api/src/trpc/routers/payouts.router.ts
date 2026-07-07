import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { payoutService } from "@/services/payout.service";
import { protectedProcedure, t } from "@/trpc/init";
import { getBusinessIdForUser } from "@/utils/business";

export const payoutsRouter = t.router({
  balance: protectedProcedure.query(async ({ ctx }) => {
    try {
      const businessId = await getBusinessIdForUser(ctx.user.id);
      if (!businessId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Business required",
        });
      }
      return payoutService.getAvailableBalance(businessId);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to get payout balance",
      });
    }
  }),

  transfer: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        accountNumber: z.string().min(10).max(10),
        bankCode: z.string().min(3).max(6),
        accountName: z.string().optional(),
        narration: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const businessId = await getBusinessIdForUser(ctx.user.id);
        if (!businessId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Business required",
          });
        }
        return await payoutService.transfer(businessId, input);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Transfer failed",
        });
      }
    }),
});
