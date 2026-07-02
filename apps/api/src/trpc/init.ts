import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { z } from "zod";
import type { Context } from "./context";

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);

export const stubQuery = (_input?: z.ZodTypeAny) =>
  protectedProcedure.query(async () => null);

export const stubMutation = (_input?: z.ZodTypeAny) =>
  protectedProcedure.mutation(async () => ({ success: true }));

export const stubList = () => protectedProcedure.query(async () => []);
