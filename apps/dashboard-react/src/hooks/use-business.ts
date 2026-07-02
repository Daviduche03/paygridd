"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useBusinessQuery() {
  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.user.me.queryOptions());
  const businessId = user?.businessId;

  const query = useQuery({
    ...trpc.business.get.queryOptions({ id: businessId! }),
    enabled: !!businessId,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export function useBusinessMutation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const mutation = useMutation(trpc.business.update.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.business.current.queryKey() });
    },
  }));

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
