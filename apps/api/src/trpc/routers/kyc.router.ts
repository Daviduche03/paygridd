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

  submitBvn: protectedProcedure
    .input(z.object({ bvn: z.string().length(11) }))
    .mutation(async ({ ctx, input }) => {
      const businessId = await getBusinessIdForUser(ctx.user.id);
      if (!businessId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No business found",
        });
      }
      return kycService.submitBvn(businessId, input.bvn);
    }),

  submitId: protectedProcedure
    .input(
      z.object({
        idType: z.enum([
          "national_id",
          "passport",
          "drivers_license",
          "voters_card",
        ]),
        idNumber: z.string().min(1),
        idFrontUrl: z.string().url(),
        idBackUrl: z.string().url().optional(),
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
      return kycService.submitId(businessId, input);
    }),

  submitAddress: protectedProcedure
    .input(z.object({ proofUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const businessId = await getBusinessIdForUser(ctx.user.id);
      if (!businessId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No business found",
        });
      }
      return kycService.submitAddress(businessId, input.proofUrl);
    }),
});
