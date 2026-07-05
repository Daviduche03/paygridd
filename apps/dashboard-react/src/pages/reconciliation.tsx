"use client";

import type { RouterOutputs } from "api";
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
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { FormatAmount } from "@/components/format-amount";
import { EmptyState } from "@/components/empty-state";
import { ScrollableContent } from "@/components/scrollable-content";
import { KpiCard, KpiGrid, SurfaceCard, kpiCardClassName, surfaceCardClassName } from "@/components/surface-card";
import { Skeleton } from "ui/skeleton";
import { cn } from "ui/cn";
import { useStableQuery } from "@/hooks/use-stable-query";
import { useTRPC } from "@/trpc/client";

type ListOutput = Extract<RouterOutputs["transactions"]["list"], { data: unknown }>;
type TransactionRow = ListOutput["data"][number];

const RECON_STATUS_STYLES = {
  pending: { label: "Pending", icon: "🟡", className: "bg-muted text-muted-foreground border-transparent" },
  matched: { label: "Matched", icon: "✅", className: "bg-muted text-foreground border-transparent" },
  underpaid: { label: "Underpaid", icon: "🟠", className: "bg-muted text-foreground border-transparent" },
  overpaid: { label: "Overpaid", icon: "🔵", className: "bg-muted text-foreground border-transparent" },
  duplicate: { label: "Duplicate", icon: "🔴", className: "bg-muted text-foreground border-transparent" },
  needs_review: { label: "Needs Review", icon: "⚪", className: "bg-muted text-muted-foreground border-transparent" },
} as const;

const RECON_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "matched", label: "Matched" },
  { value: "underpaid", label: "Underpaid" },
  { value: "overpaid", label: "Overpaid" },
  { value: "duplicate", label: "Duplicate" },
  { value: "needs_review", label: "Needs Review" },
] as const;

function getReconStyle(status: string) {
  if (status in RECON_STATUS_STYLES) {
    return RECON_STATUS_STYLES[status as keyof typeof RECON_STATUS_STYLES];
  }
  return RECON_STATUS_STYLES.pending;
}

function ReconciliationTableSkeleton() {
  const cols = [110, 110, 140, 120, 120, 100, 120, 130, 70];

  return (
    <div className={cn("w-full border border-border")}>
      <Table>
        <TableHeader>
          <TableRow className="h-[45px] flex items-center">
            {cols.map((w, i) => (
              <TableHead
                key={i}
                className="flex items-center"
                style={{ width: w, minWidth: w, maxWidth: w }}
              >
                <Skeleton className="h-3.5 w-16" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, row) => (
            <TableRow key={row} className="group h-[45px] flex items-center border-b border-border">
              {cols.map((w, col) => (
                <TableCell
                  key={col}
                  className="flex items-center"
                  style={{ width: w, minWidth: w, maxWidth: w }}
                >
                  <Skeleton className={col === 8 ? "h-3.5 w-14" : "h-3.5 w-20"} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ReconciliationKpiSkeleton() {
  return (
    <KpiGrid className="grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={cn(surfaceCardClassName(), kpiCardClassName, "space-y-2")}>
          <Skeleton className="h-[14px] w-[60px]" />
          <Skeleton className="h-[28px] w-[40px]" />
        </div>
      ))}
    </KpiGrid>
  );
}

function formatDiff(diff: number | null) {
  if (diff == null) return "—";
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${diff.toLocaleString()}`;
}

function RecoDetailView({ item, onBack }: { item: TransactionRow; onBack: () => void }) {
  const reconStyle = getReconStyle(item.reconciliation);
  const diff = item.invoiceAmount != null ? item.amount - item.invoiceAmount : null;

  return (
    <div className="space-y-6">
      <SurfaceCard className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-medium">Transaction #{item.reference}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{item.id}</p>
          </div>
          <Badge className={reconStyle.className}>
            {reconStyle.icon} {reconStyle.label}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-y-4 gap-x-8 mb-5">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Transaction</p>
            <p className="font-mono text-sm">{item.reference}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Invoice</p>
            <p className="font-mono text-sm">{item.invoice}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Customer</p>
            <p className="text-sm">{item.customer}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Invoice Amount</p>
            <p className="text-sm font-medium tabular-nums">
              {item.invoiceAmount != null ? (
                <FormatAmount amount={item.invoiceAmount} currency={item.currency} />
              ) : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Payment Amount</p>
            <p className="text-sm font-medium tabular-nums">
              <FormatAmount amount={item.amount} currency={item.currency} />
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Difference</p>
            <p className="text-sm font-medium tabular-nums text-foreground">
              {diff != null ? `${diff >= 0 ? "+" : ""}₦${formatDiff(diff)}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <Badge className={reconStyle.className}>
              {reconStyle.icon} {reconStyle.label}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Sender</p>
            <p className="text-sm">{item.sender}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Date</p>
            <p className="text-sm">{item.date}</p>
          </div>
        </div>
      </SurfaceCard>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled>Retry Match</Button>
        <Button variant="outline" size="sm" disabled>Mark as Resolved</Button>
        <Button variant="outline" size="sm" disabled>Notify Customer</Button>
      </div>

      <Button variant="ghost" size="sm" onClick={onBack}>
        <Icons.ChevronLeft className="size-4 mr-1" />
        Back to reconciliation
      </Button>
    </div>
  );
}

export default function ReconciliationPage() {
  const trpc = useTRPC();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [reconFilter, setReconFilter] = useState("all");

  const listInput = useMemo(
    () => ({
      q: q.trim() || undefined,
      reconciliationStatus: reconFilter === "all" ? undefined : (reconFilter as "pending" | "matched" | "underpaid" | "overpaid" | "duplicate" | "needs_review"),
      pageSize: 100,
    }),
    [q, reconFilter],
  );

  const { data: summary, isLoading: summaryLoading } = useStableQuery(
    trpc.transactions.reconciliationSummary.queryOptions(),
  );

  const { data: listResult, isLoading: listLoading } = useStableQuery(
    trpc.transactions.list.queryOptions(listInput),
  );

  const transactions = useMemo(() => {
    if (!listResult || Array.isArray(listResult)) return [] as TransactionRow[];
    return listResult.data ?? [];
  }, [listResult]);

  const selectedItem = selectedId ? transactions.find((t) => t.id === selectedId) ?? null : null;

  const hasFilters = q.trim().length > 0 || reconFilter !== "all";

  if (selectedItem) {
    return (
      <ScrollableContent>
        <div className="flex flex-col pt-6">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h1 className="text-xl font-semibold">Reconciliation</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Match incoming payments to invoices and resolve discrepancies.
              </p>
            </div>
          </div>
          <RecoDetailView item={selectedItem} onBack={() => setSelectedId(null)} />
        </div>
      </ScrollableContent>
    );
  }

  return (
    <ScrollableContent>
      <div className="flex flex-col pt-6">
        <div className="flex items-start justify-between pb-6">
          <div>
            <h1 className="text-xl font-semibold">Reconciliation</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Match incoming payments to invoices and resolve discrepancies.
            </p>
          </div>
        </div>

        {!listLoading && transactions.length === 0 && !hasFilters ? (
          <EmptyState
            icon={<Icons.Check className="size-5 text-muted-foreground" />}
            title="All caught up"
            description="No pending reconciliation items. All transactions have been matched."
          />
        ) : (
          <>
            {summaryLoading ? (
              <ReconciliationKpiSkeleton />
            ) : (
              <KpiGrid className="grid-cols-4">
                <KpiCard
                  label="Pending"
                  value={String(summary?.pending ?? 0)}
                />
                <KpiCard
                  label="Matched"
                  value={String(summary?.matched ?? 0)}
                />
                <KpiCard
                  label="Discrepancies"
                  value={String(summary?.discrepancies ?? 0)}
                />
                <KpiCard
                  label="Total"
                  value={String((summary?.pending ?? 0) + (summary?.matched ?? 0) + (summary?.discrepancies ?? 0))}
                />
              </KpiGrid>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-full max-w-[280px]">
                <Icons.Search className="absolute pointer-events-none left-3 top-[11px] size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reference, customer, sender..."
                  className="pl-9"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                />
              </div>
              <Select value={reconFilter} onValueChange={setReconFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {RECON_FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <SurfaceCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Reference</TableHead>
                    <TableHead className="w-[110px]">Invoice</TableHead>
                    <TableHead className="w-[140px]">Customer</TableHead>
                    <TableHead className="w-[120px]">Payment Amt</TableHead>
                    <TableHead className="w-[120px]">Invoice Amt</TableHead>
                    <TableHead className="w-[100px]">Diff</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[130px]">Date</TableHead>
                    <TableHead className="w-[70px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listLoading ? (
                    <ReconciliationTableSkeleton />
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No transactions match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((item) => {
                      const reconStyle = getReconStyle(item.reconciliation);
                      const diff = item.invoiceAmount != null ? item.amount - item.invoiceAmount : null;

                      return (
                        <TableRow
                          key={item.id}
                          className="h-[45px] cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedId(item.id)}
                        >
                          <TableCell className="font-mono text-xs">{item.reference}</TableCell>
                          <TableCell className="font-mono text-xs">{item.invoice}</TableCell>
                          <TableCell>{item.customer}</TableCell>
                          <TableCell className="tabular-nums">
                            <FormatAmount amount={item.amount} currency={item.currency} />
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {item.invoiceAmount != null ? (
                              <FormatAmount amount={item.invoiceAmount} currency={item.currency} />
                            ) : "—"}
                          </TableCell>
                          <TableCell className="tabular-nums font-medium text-foreground">
                            {diff != null ? `${diff >= 0 ? "+" : ""}₦${Math.abs(diff).toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge className={reconStyle.className}>
                              {reconStyle.icon} {reconStyle.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.date}</TableCell>
                          <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="size-8 p-0">
                                  <DotsHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 bg-background border-border">
                                <DropdownMenuItem onClick={() => setSelectedId(item.id)}>View Details</DropdownMenuItem>
                                <DropdownMenuItem disabled>Retry Match</DropdownMenuItem>
                                <DropdownMenuItem disabled>Mark Resolved</DropdownMenuItem>
                                <DropdownMenuItem disabled>Notify Customer</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </SurfaceCard>
          </>
        )}
      </div>
    </ScrollableContent>
  );
}
