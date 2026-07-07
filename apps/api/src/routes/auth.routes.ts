import { Router } from "express";
import { env } from "@/config/env";
import { authService } from "@/services/auth.service";
import { asyncHandler } from "@/utils/asyncHandler";

export const authRoutes = Router();

function sanitizeReturnTo(returnTo?: string) {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return undefined;
  }
  return returnTo;
}

authRoutes.get(
  "/google",
  asyncHandler(async (req, res) => {
    const returnTo = req.query.return_to as string | undefined;
    const url = await authService.getGoogleAuthUrl(returnTo);
    res.redirect(url);
  }),
);

authRoutes.get(
  "/google/callback",
  asyncHandler(async (req, res) => {
    const { code, state } = req.query as { code?: string; state?: string };

    if (!code) {
      res.status(400).json({ success: false, error: "Missing code" });
      return;
    }

    const { token, returnTo } = await authService.handleGoogleCallback(
      code,
      state,
    );

    const redirectUrl = new URL("/verify", env.FRONTEND_URL);
    redirectUrl.searchParams.set("token", token);

    const safeReturnTo = sanitizeReturnTo(returnTo);
    if (safeReturnTo) {
      redirectUrl.searchParams.set("return_to", safeReturnTo);
    }

    res.redirect(redirectUrl.toString());
  }),
);
