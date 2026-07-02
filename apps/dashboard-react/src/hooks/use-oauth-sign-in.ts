import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { getApiUrl } from "@/utils/api-url";

export type OAuthProvider = "google";

type ProviderConfig = {
  name: string;
  icon: "Google";
  scopes?: string;
  queryParams?: Record<string, string>;
  variant: "primary" | "secondary";
  supportsReturnTo: boolean;
};

const OAUTH_PROVIDERS: Record<OAuthProvider, ProviderConfig> = {
  google: {
    name: "Google",
    icon: "Google",
    queryParams: { prompt: "select_account" },
    variant: "secondary",
    supportsReturnTo: true,
  },
};

export function useOAuthSignIn(provider: OAuthProvider) {
  const [isLoading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("return_to");
  const config = OAUTH_PROVIDERS[provider];

  const handleSignIn = () => {
    setLoading(true);

    const apiBase = getApiUrl();
    const redirectUrl = apiBase
      ? new URL(`${apiBase}/auth/google`)
      : new URL("/auth/google", window.location.origin);

    if (config.supportsReturnTo && returnTo) {
      redirectUrl.searchParams.append("return_to", returnTo);
    }

    window.location.href = redirectUrl.toString();

    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return { handleSignIn, isLoading, config };
}
