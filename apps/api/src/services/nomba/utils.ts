import { logger } from "@/utils/logger";

type NombaError = {
  code?: string;
  description?: string;
};

export function parseNombaError(error: unknown): {
  message: string;
  code: string;
} | null {
  const e = error as {
    response?: { data?: NombaError };
    message?: string;
  };

  const providerError = e?.response?.data;

  if (providerError?.description) {
    logger.warn("Nomba provider error", {
      code: providerError.code,
      description: providerError.description,
    });

    return {
      message: providerError.description,
      code: providerError.code ?? "unknown",
    };
  }

  if (e?.message) {
    return {
      message: e.message,
      code: "unknown",
    };
  }

  return null;
}

export function getErrorStatusCode(error: unknown): number | null {
  const e = error as {
    response?: { status?: number };
    status?: number;
    statusCode?: number;
  };

  return e?.response?.status ?? e?.status ?? e?.statusCode ?? null;
}
