"use server";

import { z } from "zod";
import { authActionClient } from "./safe-action";

// MFA removed
export const mfaVerifyAction = authActionClient
  .schema(
    z.object({
      factorId: z.string(),
      challengeId: z.string(),
      code: z.string(),
    }),
  )
  .metadata({ name: "mfa-verify" })
  .action(async () => {
    return { success: true };
  });
