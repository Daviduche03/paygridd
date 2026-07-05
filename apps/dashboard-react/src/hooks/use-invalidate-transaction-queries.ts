"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useInvalidateTransactionQueries() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: trpc.transactions.get.infiniteQueryKey(),
    });

    queryClient.invalidateQueries({
      queryKey: trpc.transactions.getById.queryKey(),
    });

    queryClient.invalidateQueries({
      queryKey: trpc.overview.summary.queryKey(),
    });
  };
}
