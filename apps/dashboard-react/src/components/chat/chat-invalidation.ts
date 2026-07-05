"use client";

import type { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { useTRPC } from "@/trpc/client";
import { isToolPart, normalizeToolPart } from "./chat-utils";

type TRPCProxy = ReturnType<typeof useTRPC>;
type InvalidationFn = (trpc: TRPCProxy, qc: QueryClient) => void;

function invalidateCustomers(trpc: TRPCProxy, qc: QueryClient) {
  qc.invalidateQueries({ queryKey: trpc.customers.get.infiniteQueryKey() });
  qc.invalidateQueries({ queryKey: trpc.customers.get.queryKey() });
  qc.invalidateQueries({ queryKey: trpc.customers.getById.queryKey() });
}

function invalidateTransactions(trpc: TRPCProxy, qc: QueryClient) {
  qc.invalidateQueries({
    queryKey: trpc.transactions.get.infiniteQueryKey(),
  });
  qc.invalidateQueries({ queryKey: trpc.transactions.getById.queryKey() });
  qc.invalidateQueries({ queryKey: trpc.overview.summary.queryKey() });
}

function invalidateInvoices(trpc: TRPCProxy, qc: QueryClient) {
  qc.invalidateQueries({ queryKey: trpc.invoice.getById.queryKey() });
  qc.invalidateQueries({ queryKey: trpc.invoice.get.infiniteQueryKey() });
  qc.invalidateQueries({ queryKey: trpc.invoice.invoiceSummary.queryKey() });
  qc.invalidateQueries({ queryKey: trpc.invoice.paymentStatus.queryKey() });
}

function invalidateVirtualAccounts(trpc: TRPCProxy, qc: QueryClient) {
  qc.invalidateQueries({ queryKey: trpc.virtualAccounts.list.queryKey() });
  qc.invalidateQueries({ queryKey: trpc.virtualAccounts.summary.queryKey() });
}

const TOOL_INVALIDATION_MAP: Record<string, InvalidationFn> = {
  customers_create: invalidateCustomers,
  customers_update: invalidateCustomers,
  customers_delete: invalidateCustomers,

  transactions_create: invalidateTransactions,
  transactions_create_bulk: invalidateTransactions,
  transactions_update: invalidateTransactions,
  transactions_update_bulk: invalidateTransactions,
  transactions_delete: invalidateTransactions,
  transactions_delete_bulk: invalidateTransactions,

  invoices_create: invalidateInvoices,
  invoices_update: invalidateInvoices,
  invoices_update_draft: invalidateInvoices,
  invoices_delete: invalidateInvoices,
  invoices_send: invalidateInvoices,
  invoices_mark_paid: invalidateInvoices,
  invoices_cancel: invalidateInvoices,
  invoices_duplicate: invalidateInvoices,

  virtual_accounts_create: invalidateVirtualAccounts,
  virtual_accounts_update: invalidateVirtualAccounts,
};

export function useChatToolInvalidation(messages: UIMessage[]) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const processedRef = useRef(new Set<string>());

  useEffect(() => {
    let didInvalidate = false;

    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of message.parts) {
        if (!isToolPart(part as { type: string })) continue;
        const norm = normalizeToolPart(part as Record<string, unknown>);
        if (norm.state !== "output-available") continue;
        if (processedRef.current.has(norm.toolCallId)) continue;

        const invalidate = TOOL_INVALIDATION_MAP[norm.toolName];
        if (invalidate) {
          processedRef.current.add(norm.toolCallId);
          invalidate(trpc, queryClient);
          didInvalidate = true;
        }
      }
    }
  }, [messages, trpc, queryClient]);
}
