import type { QueryClient } from "@tanstack/react-query";

let queryClient: QueryClient | null = null;

export function bindQueryClient(client: QueryClient) {
  queryClient = client;
}

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )auth-token=([^;]*)/);
  if (!match?.[1]) return null;
  const token = decodeURIComponent(match[1]);
  return token.length > 0 ? token : null;
}

export function hasAuthToken(): boolean {
  return getAuthToken() !== null;
}

export async function getAccessToken(): Promise<string | null> {
  return getAuthToken();
}

export function setAuthToken(token: string) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 7;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `auth-token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  queryClient?.clear();
}

export function clearAuthToken() {
  if (typeof document === "undefined") return;
  document.cookie =
    "auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  queryClient?.clear();
}
