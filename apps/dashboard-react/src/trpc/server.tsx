import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "api";
import { getApiUrl } from "@/utils/api-url";
import { makeQueryClient } from "./query-client";

let queryClientInstance: ReturnType<typeof makeQueryClient> | null = null;

export function getQueryClient() {
  if (!queryClientInstance) {
    queryClientInstance = makeQueryClient();
  }
  return queryClientInstance;
}

function getAuthToken(): string | null {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|; )auth-token=([^;]*)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

let trpcInstance: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;

function getOrCreateTRPC() {
  if (trpcInstance) return trpcInstance;

  trpcInstance = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${getApiUrl()}/trpc`,
        transformer: superjson,
        headers: () => {
          const token = getAuthToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });

  return trpcInstance;
}

export const trpc = new Proxy({} as any, {
  get(_, prop: string) {
    return (getOrCreateTRPC() as any)[prop];
  },
});

export async function prefetch(queryOptions: any) {
  const qc = getQueryClient();
  void qc.prefetchQuery(queryOptions).catch(() => {});
}

export function batchPrefetch(queryOptionsArray: any[]) {
  const qc = getQueryClient();
  for (const queryOptions of queryOptionsArray) {
    if (queryOptions.queryKey[1]?.type === "infinite") {
      void qc.prefetchInfiniteQuery(queryOptions).catch(() => {});
    } else {
      void qc.prefetchQuery(queryOptions).catch(() => {});
    }
  }
}

export function HydrateClient(props: { children: React.ReactNode }) {
  return <>{props.children}</>;
}
