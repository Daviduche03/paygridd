"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { actionClient } from "./safe-action";

// OTP sign-in has been removed. Only Google OAuth is supported now.
export const verifyOtpAction = actionClient
  .schema(
    z.object({
      token: z.string(),
      email: z.string(),
      redirectTo: z.string(),
    }),
  )
  .action(async ({ parsedInput: { redirectTo } }) => {
    // Redirect anyway - no-op
    redirect(redirectTo);
  });
