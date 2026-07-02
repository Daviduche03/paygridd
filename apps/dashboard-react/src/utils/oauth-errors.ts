export const OAUTH_ERROR_CODES = [
  "access_denied",
  "missing_license",
  "missing_permissions",
  "invalid_state",
  "token_exchange_failed",
  "unknown_error",
] as const;

export type OAuthErrorCode = (typeof OAUTH_ERROR_CODES)[number];
