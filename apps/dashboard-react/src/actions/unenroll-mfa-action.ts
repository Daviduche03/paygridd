"use server";

import { z } from "zod";
import { authActionClient } from "./safe-action";

// MFA fully removed (was tied to Supabase)
export const unenrollMfaAction = authActionClient
  .schema(
    z.object({
      factorId: z.string(),
    }),
  )
  .metadata({
    name: "unenroll-mfa",
  })
  .action(async () => {
    return { success: true };
  });
