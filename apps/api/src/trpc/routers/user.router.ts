import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { userService } from "@/services/user.service";
import { membershipRepository } from "@/repositories/membership.repository";
import { membersService } from "@/services/members.service";
import { protectedProcedure, t } from "@/trpc/init";

export const userRouter = t.router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await userService.getUserById(ctx.user.id);
    if (!user) return null;

    let businessRole: string | null = null;
    if (user.businessId) {
      const membership = await membershipRepository.findOne(ctx.user.id, user.businessId);
      businessRole = membership?.role ?? null;
    }

    return { ...user, businessRole };
  }),
  update: protectedProcedure
    .input(z.object({ fullName: z.string().optional(), avatarUrl: z.string().optional() }))
    .mutation(async ({ ctx, input }) => userService.updateUser(ctx.user.id, input)),
  delete: protectedProcedure.mutation(async () => ({ success: true })),
  invites: protectedProcedure.query(async ({ ctx }) => {
    const user = await userService.getUserById(ctx.user.id);
    if (!user?.email) return [];
    return membersService.getUserInvites(user.email);
  }),
  switchBusiness: protectedProcedure
    .input(z.object({ businessId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await membershipRepository.findOne(ctx.user.id, input.businessId);
      if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a member of this business" });
      await userService.switchBusiness(ctx.user.id, input.businessId);
      return { success: true };
    }),
});
