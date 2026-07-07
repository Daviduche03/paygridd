"use client";

import type { RouterOutputs } from "api";
import { useQueryClient } from "@tanstack/react-query";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Icons } from "ui/icons";
import { Input } from "ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "ui/tabs";
import { useToast } from "ui/use-toast";
import { FormatAmount } from "@/components/format-amount";
import { ScrollableContent } from "@/components/scrollable-content";
import { EmptyState } from "@/components/empty-state";
import { KpiCard, KpiGrid, SurfaceCard } from "@/components/surface-card";
import { TransactionsKpiSkeleton, TransactionsTableSkeleton } from "@/components/transactions-skeleton";
import { useStableQuery } from "@/hooks/use-stable-query";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";

type ListOutput = Extract<RouterOutputs["transactions"]["list"], { data: unknown }>;
type TransactionRow = ListOutput["data"][number];

const TX_STATUS_STYLES = {
  success: { label: "Success", className: "bg-muted text-foreground border-transparent" },
  pending: { label: "Pending", className: "bg-muted text-muted-foreground border-transparent" },
  failed: { label: "Failed", className: "bg-muted text-foreground border-transparent" },
  reversed: { label: "Reversed", className: "bg-muted text-muted-foreground border-transparent" },
} as const;

const RECON_STATUS_STYLES = {
  matched: { label: "Matched", icon: "✅", className: "bg-muted text-foreground border-transparent" },
  pending: { label: "Pending", icon: "🟡", className: "bg-muted text-muted-foreground border-transparent" },
  underpaid: { label: "Underpaid", icon: "🟠", className: "bg-muted text-foreground border-transparent" },
  overpaid: { label: "Overpaid", icon: "🔵", className: "bg-muted text-foreground border-transparent" },
  duplicate: { label: "Duplicate", icon: "🔴", className: "bg-muted text-foreground border-transparent" },
  needs_review: { label: "Needs Review", icon: "⚪", className: "bg-muted text-muted-foreground border-transparent" },
} as const;

type SearchField = "reference" | "customer" | "account" | "sender";
type SummaryData = {
  totalCount: number;
  successCount: number;
  pendingReconciliationCount: number;
  failedReversedCount: number;
  volumeToday: number;
  currency: string;
};
type ListData = { data: TransactionRow[]; meta: { cursor: string | null } };

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

function getReconStyle(status: string) {
  if (status in RECON_STATUS_STYLES) {
    return RECON_STATUS_STYLES[status as keyof typeof RECON_STATUS_STYLES];
  }
  return RECON_STATUS_STYLES.pending;
}

function getTxStatusStyle(status: string) {
  if (status in TX_STATUS_STYLES) {
    return TX_STATUS_STYLES[status as keyof typeof TX_STATUS_STYLES];
  }
  return TX_STATUS_STYLES.pending;
}

export default function TransactionsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchField, setSearchField] = useState<SearchField>("reference");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  const listInput = useMemo(
    () => ({
      q: q.trim() || undefined,
      searchField,
      status:
        status === "all"
          ? undefined
          : (status as "success" | "pending" | "failed" | "reversed"),
      type: type === "all" ? undefined : (type as "credit" | "debit"),
      dateRange:
        dateRange === "all"
          ? undefined
          : (dateRange as "today" | "7d" | "30d" | "90d"),
      pageSize: 50,
    }),
    [q, searchField, status, type, dateRange],
  );

  const { data: _summary, isLoading: summaryLoading } = useStableQuery(
    trpc.transactions.summary.queryOptions(),
  );
  const summary = _summary as SummaryData | undefined;

  const { data: _listResult, isLoading: listLoading, isFetching } = useStableQuery(
    trpc.transactions.list.queryOptions(listInput),
  );
  const listResult = _listResult as ListData | undefined;

  const transactions = useMemo(() => {
    if (!listResult || Array.isArray(listResult)) return [] as TransactionRow[];
    return listResult.data ?? [];
  }, [listResult]);

  const currency = summary?.currency ?? "NGN";
  const isLoading = summaryLoading || listLoading;
  const hasFilters =
    q.trim().length > 0 ||
    status !== "all" ||
    type !== "all" ||
    dateRange !== "all";

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: trpc.transactions.summary.queryKey() });
    queryClient.invalidateQueries({ queryKey: trpc.transactions.list.queryKey() });
  };

  const handleCopyReference = async (reference: string) => {
    await copyText(reference);
    toast({ title: "Reference copied" });
  };

  return (
    <ScrollableContent>
      <div className="flex flex-col">
        <div className="flex items-start justify-between pb-6 pt-6">
          <div>
            <h1 className="text-xl font-semibold">Transactions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor every incoming payment, transfer, and reconciliation event across all virtual accounts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <Icons.Add className="size-3.5 mr-1.5" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <Icons.Refresh className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {!isLoading && transactions.length === 0 && !hasFilters ? (
          <EmptyState
            className="py-24"
            icon={<Icons.Add className="size-5 text-muted-foreground" />}
            title="No transactions yet"
            description="Incoming payments will appear here once customers begin paying into their dedicated virtual accounts."
          />
        ) : (
          <>
            {summaryLoading ? (
              <TransactionsKpiSkeleton />
            ) : (
              <KpiGrid className="grid-cols-5">
                <KpiCard
                  label="Total Transactions"
                  value={String(summary?.totalCount ?? 0)}
                />
                <KpiCard
                  label="Successful"
                  value={String(summary?.successCount ?? 0)}
                />
                <KpiCard
                  label="Pending Reconciliation"
                  value={String(summary?.pendingReconciliationCount ?? 0)}
                />
                <KpiCard
                  label="Failed / Reversed"
                  value={String(summary?.failedReversedCount ?? 0)}
                />
                <KpiCard
                  label="Total Volume Today"
                  value={
                    formatAmount({
                      currency,
                      amount: summary?.volumeToday ?? 0,
                      maximumFractionDigits: 0,
                    }) ?? "—"
                  }
                />
              </KpiGrid>
            )}

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <Tabs
                  value={searchField}
                  onValueChange={(value) => setSearchField(value as SearchField)}
                  className="border-0"
                >
                  <TabsList className="bg-transparent border border-border h-9 p-0">
                    <TabsTrigger value="reference" className="text-xs px-3 py-1.5 data-[state=active]:bg-muted rounded-none">
                      Reference
                    </TabsTrigger>

                    <TabsTrigger value="account" className="text-xs px-3 py-1.5 data-[state=active]:bg-muted rounded-none">
                      Virtual Account
                    </TabsTrigger>
                    <TabsTrigger value="sender" className="text-xs px-3 py-1.5 data-[state=active]:bg-muted rounded-none">
                      Sender
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="relative flex-1 max-w-[320px]">
                  <Icons.Search className="absolute pointer-events-none left-3 top-[11px] size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    className="pl-9"
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="reversed">Reversed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>

              </div>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 mb-3 border border-border bg-muted/30">
                <span className="text-sm text-muted-foreground mr-2">
                  {selectedIds.size} selected
                </span>
                <Button variant="outline" size="sm" disabled>
                  Export
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Retry Reconciliation
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Mark as Reviewed
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Assign Customer
                </Button>
              </div>
            )}

            <SurfaceCard>
              {listLoading ? (
                <TransactionsTableSkeleton />
              ) : transactions.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">
                  No transactions match your filters.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <input
                          type="checkbox"
                          checked={
                            transactions.length > 0 &&
                            selectedIds.size === transactions.length
                          }
                          onChange={toggleAll}
                          className="size-4 accent-primary"
                        />
                      </TableHead>
                      <TableHead className="w-[110px]">Reference</TableHead>
                      <TableHead className="w-[140px]">Customer</TableHead>
                      <TableHead className="w-[200px]">Virtual Account</TableHead>
                      <TableHead className="w-[140px]">Sender</TableHead>
                      <TableHead className="w-[110px]">Amount</TableHead>
                      <TableHead className="w-[80px]">Type</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[130px]">Reconciliation</TableHead>
                      <TableHead className="w-[120px]">Invoice</TableHead>
                      <TableHead className="w-[130px]">Date</TableHead>
                      <TableHead className="w-[70px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => {
                      const txStatus = getTxStatusStyle(tx.status);
                      const reconStatus = getReconStyle(tx.reconciliation);

                      return (
                        <TableRow key={tx.id} className="h-[45px] hover:bg-muted/50">
                          <TableCell onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(tx.id)}
                              onChange={() => toggleSelect(tx.id)}
                              className="size-4 accent-primary"
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                          <TableCell>{tx.customer}</TableCell>
                          <TableCell className="text-muted-foreground text-xs truncate max-w-[200px]">
                            {tx.virtualAccount}
                          </TableCell>
                          <TableCell>{tx.sender}</TableCell>
                          <TableCell className="tabular-nums font-medium">
                            <FormatAmount amount={tx.amount} currency={tx.currency} />
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                tx.type === "credit"
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }
                            >
                              {tx.type === "credit" ? "Credit" : "Debit"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={txStatus.className}>{txStatus.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={reconStatus.className}>
                              {reconStatus.icon} {reconStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {tx.invoice}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{tx.date}</TableCell>
                          <TableCell
                            className="text-right"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="size-8 p-0">
                                  <DotsHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-44 bg-background border-border"
                              >
                                <DropdownMenuItem
                                  onClick={() => handleCopyReference(tx.reference)}
                                >
                                  Copy Reference
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </SurfaceCard>
          </>
        )}
      </div>
    </ScrollableContent>
  );
}
