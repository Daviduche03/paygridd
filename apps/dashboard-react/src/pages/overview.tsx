"use client";

import { useLayoutEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { OverviewView } from "@/components/widgets";
import { useTRPC } from "@/trpc/client";

export default function OverviewPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  useLayoutEffect(() => {
    void queryClient.ensureQueryData(trpc.overview.summary.queryOptions());
  }, [queryClient, trpc]);

  return <OverviewView />;
}
