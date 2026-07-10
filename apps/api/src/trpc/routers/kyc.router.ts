import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { kycService } from "@/services/kyc.service";
import { protectedProcedure, t } from "@/trpc/init";
import { getBusinessIdForUser } from "@/utils/business";

export const kycRouter = t.router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const businessId = await getBusinessIdForUser(ctx.user.id);
    if (!businessId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No business found",
      });
    }
    return kycService.getStatus(businessId);
  }),

  submitTier2: protectedProcedure
    .input(
      z.object({
        rcNumber: z.string().min(1),
        cacDocumentUrl: z.string().url(),
        directorName: z.string().min(1),
        directorPhone: z.string().min(1),
        businessAddressProofUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const businessId = await getBusinessIdForUser(ctx.user.id);
      if (!businessId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No business found",
        });
      }
      return kycService.submitTier2(businessId, input);
    }),

  submitTier3: protectedProcedure
    .input(
      z.object({
        directorBvn: z.string().length(11),
        memorandumUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const businessId = await getBusinessIdForUser(ctx.user.id);
      if (!businessId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No business found",
        });
      }
      return kycService.submitTier3(businessId, input);
    }),

  approveTier2: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return kycService.approveTier2(input.businessId, ctx.user.id);
    }),

  approveTier3: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return kycService.approveTier3(input.businessId, ctx.user.id);
    }),

  reject: protectedProcedure
    .input(
      z.object({
        businessId: z.string().uuid(),
        reason: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return kycService.reject(input.businessId, ctx.user.id, input.reason);
    }),
});
