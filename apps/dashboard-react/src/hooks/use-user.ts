"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useUserQuery() {
  const trpc = useTRPC();
  const query = useQuery(trpc.user.me.queryOptions());
  return {
    data: query.data ?? null,
    isLoading: query.isPending && !query.data,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  } as const;
}

export function useUserMutation() {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.user.update.mutationOptions());
  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
