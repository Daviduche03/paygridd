import { z } from "zod";
import { userService } from "@/services/user.service";
import { protectedProcedure, stubList, stubMutation, t } from "@/trpc/init";

export const userRouter = t.router({
  me: protectedProcedure.query(async ({ ctx }) => userService.getUserById(ctx.user.id)),
  update: protectedProcedure
    .input(z.object({ fullName: z.string().optional(), avatarUrl: z.string().optional() }))
    .mutation(async ({ ctx, input }) => userService.updateUser(ctx.user.id, input)),
  delete: protectedProcedure.mutation(async () => ({ success: true })),
  invites: stubList(),
  switchBusiness: protectedProcedure
    .input(z.object({ businessId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await userService.switchBusiness(ctx.user.id, input.businessId);
      return { success: true };
    }),
});
