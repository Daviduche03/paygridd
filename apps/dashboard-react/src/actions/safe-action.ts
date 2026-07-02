import { setupAnalytics } from "eventbus/server";
import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action";
import { z } from "zod";
import { logger } from "@/utils/logger";

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

export const actionClientWithMeta = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      name: z.string(),
      track: z
        .object({
          event: z.string(),
          channel: z.string(),
        })
        .optional(),
    });
  },
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

export const authActionClient = actionClientWithMeta
  .use(async ({ next, clientInput, metadata }) => {
    const result = await next({ ctx: {} });

    if (process.env.NODE_ENV === "development") {
      logger("Input ->", clientInput);
      logger("Result ->", result.data);
      logger("Metadata ->", metadata);

      return result;
    }

    return result;
  })
  .use(async ({ next, metadata }) => {
    let user: any = null;
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const token = cookieStore.get("auth-token")?.value;
      if (token) {
        const API_URL = process.env.API_URL || "http://localhost:3003";
        const res = await fetch(`${API_URL}/trpc/user.me`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        const json = await res.json();
        user = json?.result?.data?.json ?? json?.result?.data;
      }
    } catch (e) {
      // not logged in
    }

    if (!user) {
      throw new Error("Unauthorized");
    }

    const analytics = await setupAnalytics();

    if (metadata?.track) {
      analytics.track(metadata.track);
    }

    return next({
      ctx: {
        analytics,
        user,
        businessId: user.businessId,
      },
    });
  });
