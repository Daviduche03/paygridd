import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import type { Context } from "./context";
import { membershipRepository } from "@/repositories/membership.repository";
import { userRepository } from "@/repositories/user.repository";
import { businessRepository } from "@/repositories/business.repository";
import type { BusinessRole } from "@/repositories/membership.repository";

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const requireRole = (...roles: BusinessRole[]) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const user = await userRepository.findById(ctx.user.id);
    if (!user?.businessId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No business selected" });
    }

    let membership = await membershipRepository.findOne(ctx.user.id, user.businessId);
    if (!membership) {
      const count = await membershipRepository.countByBusiness(user.businessId);
      const autoRole = count === 0 ? "owner" : "member";
      membership = await membershipRepository.create({
        userId: ctx.user.id,
        businessId: user.businessId,
        role: autoRole,
      });
    }

    if (roles.length > 0 && !roles.includes(membership.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Requires one of roles: ${roles.join(", ")}`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        businessId: user.businessId,
        membershipRole: membership.role,
      },
    });
  });

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const roleProtectedProcedure = (...roles: BusinessRole[]) =>
  protectedProcedure.use(requireRole(...roles));

const stub = () => ({} as never);

export function stubMutation(inputSchema?: z.ZodTypeAny) {
  const base = protectedProcedure;
  const withInput = inputSchema ? base.input(inputSchema) : base;
  return withInput.mutation(stub);
}

export function stubQuery(inputSchema?: z.ZodTypeAny) {
  const base = protectedProcedure;
  const withInput = inputSchema ? base.input(inputSchema) : base;
  return withInput.query(stub);
}

export function stubList() {
  return protectedProcedure.query(() => []);
}
