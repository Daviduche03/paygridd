import {
  MutationCache,
  defaultShouldDehydrateQuery,
  isServer,
  keepPreviousData,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import superjson from "superjson";

import { hasAuthToken } from "@/utils/session";

function isUnauthorizedError(error: Error): boolean {
  if ("data" in error && typeof (error as any).data?.code === "string") {
    return (error as any).data.code === "UNAUTHORIZED";
  }
  return false;
}

function handleAuthError(error: Error) {
  if (isUnauthorizedError(error) && hasAuthToken()) {
    window.location.href = "/login";
  }
}

export function makeQueryClient() {
  return new QueryClient({
    queryCache: isServer
      ? undefined
      : new QueryCache({ onError: handleAuthError }),
    mutationCache: isServer
      ? undefined
      : new MutationCache({ onError: handleAuthError }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        placeholderData: keepPreviousData,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: isServer
          ? false
          : (failureCount, error) => {
              // Never retry auth errors — the token won't change between attempts
              // and retrying just delays the redirect to /login.
              if (isUnauthorizedError(error)) return false;
              return failureCount < 2;
            },
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
