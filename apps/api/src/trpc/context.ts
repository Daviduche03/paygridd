import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { verifyToken } from "@/utils/jwt";

export async function createContext({ req, res }: CreateExpressContextOptions) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies) {
    const cookies = req.cookies as Record<string, string | undefined>;
    token = cookies["auth-token"] ?? cookies.token;
  }

  let user: { id: string; email: string } | null = null;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      user = { id: payload.userId, email: payload.email };
    }
  }

  return { req, res, user };
}

export type Context = inferAsyncReturnType<typeof createContext>;
