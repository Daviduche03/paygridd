"use client";

import type { RouterOutputs } from "api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
} from "ui/sheet";
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
import { useToast } from "ui/use-toast";
import { FormatAmount } from "@/components/format-amount";
import { EmptyState } from "@/components/empty-state";
import { KpiCard, KpiGrid, SurfaceCard, SurfaceCardHeader } from "@/components/surface-card";
import { ScrollableContent } from "@/components/scrollable-content";
import { KpiCardsSkeleton, VirtualAccountsTableSkeleton } from "@/components/virtual-accounts-skeleton";
import { useStableQuery } from "@/hooks/use-stable-query";
import { useTRPC } from "@/trpc/client";
import { formatAmount, formatRelativeTime } from "@/utils/format";

type VirtualAccountDetail = NonNullable<RouterOutputs["virtualAccounts"]["getById"]>;
type VirtualAccountTransaction = RouterOutputs["virtualAccounts"]["transactions"][number];

const TX_STATUS_STYLES = {
  matched: { label: "Matched", className: "bg-muted text-foreground border-transparent" },
  pending: { label: "Pending", className: "bg-muted text-muted-foreground border-transparent" },
  failed: { label: "Failed", className: "bg-muted text-foreground border-transparent" },
} as const;

const statusConfig = {
  active: { label: "Active", className: "bg-muted text-foreground border-transparent" },
  suspended: { label: "Suspended", className: "bg-muted text-foreground border-transparent" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-transparent" },
  expired: { label: "Expired", className: "bg-muted text-muted-foreground border-transparent" },
} as const;

function toNumber(value: string | number | null | undefined) {
  if (value == null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapTxStatus(tx: VirtualAccountTransaction): keyof typeof TX_STATUS_STYLES {
  if (tx.status === "failed" || tx.status === "reversed") return "failed";
  if (tx.reconciliationStatus === "matched") return "matched";
  return "pending";
}

function formatDisplayDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "MMM d, yyyy");
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

type ProvisionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (accountId: string) => void;
};

function ProvisionSheet({ open, onOpenChange, onCreated }: ProvisionSheetProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "success">("form");
  const [customerId, setCustomerId] = useState<string>("");
  const [accountName, setAccountName] = useState("");
  const [accountRef, setAccountRef] = useState("");
  const [createdAccount, setCreatedAccount] = useState<VirtualAccountDetail | null>(null);

  const { data: customersData } = useQuery(
    trpc.customers.get.queryOptions({ pageSize: 100 }),
  );

  const customers = customersData?.data ?? [];

  const createMutation = useMutation(
    trpc.virtualAccounts.create.mutationOptions({
      onSuccess: (account) => {
        if (!account) return;
        setCreatedAccount(account);
        setStep("success");
        queryClient.invalidateQueries({ queryKey: trpc.virtualAccounts.list.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.virtualAccounts.summary.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.overview.summary.queryKey() });
        onCreated(account.id);
      },
      onError: (error) => {
        toast({
          variant: "error",
          title: "Failed to provision account",
          description: error.message,
        });
      },
    }),
  );

  const handleClose = () => {
    setStep("form");
    setCustomerId("");
    setAccountName("");
    setAccountRef("");
    setCreatedAccount(null);
    onOpenChange(false);
  };

  const handleProvision = () => {
    if (!accountName.trim()) {
      toast({ variant: "error", title: "Account name is required" });
      return;
    }

    createMutation.mutate({
      customerId: customerId || null,
      accountName: accountName.trim(),
      accountRef: accountRef.trim() || undefined,
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <SheetContent className="sm:max-w-[500px]">
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <h2 className="text-xl">{step === "form" ? "Provision New Account" : "Account Provisioned"}</h2>
          <Button size="icon" variant="ghost" onClick={handleClose} className="p-0 m-0 size-auto hover:bg-transparent">
            <Icons.Close className="size-5" />
          </Button>
        </SheetHeader>

        {step === "form" && (
          <>
            <SheetDescription className="mb-6">
              Create a dedicated virtual account for a customer via Nomba.
            </SheetDescription>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Customer</label>
                <Select
                  value={customerId || undefined}
                  onValueChange={(value) => {
                    setCustomerId(value);
                    const customer = customers.find((c) => c.id === value);
                    if (customer?.name) {
                      setAccountName(customer.name);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer (optional)" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Account Name <span className="text-foreground">*</span>
                </label>
                <Input
                  placeholder="e.g. Primary Account, School Fees"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Reference ID</label>
                <Input
                  placeholder="Optional reference for reconciliation"
                  value={accountRef}
                  onChange={(e) => setAccountRef(e.target.value)}
                />
              </div>
            </div>

            <SheetFooter className="mt-8">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleProvision} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Provisioning..." : "Provision Virtual Account"}
              </Button>
            </SheetFooter>
          </>
        )}

        {step === "success" && createdAccount && (
          <>
            <SheetDescription className="mb-6">
              Virtual account created successfully.
            </SheetDescription>

            <SurfaceCard className="space-y-4 p-5">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Account Number</p>
                <p className="text-lg font-semibold font-mono tracking-wider">{createdAccount.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bank Name</p>
                <p className="font-medium">{createdAccount.bankName || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Account Name</p>
                <p className="font-medium">{createdAccount.accountName}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  copyText(
                    `${createdAccount.accountName}\n${createdAccount.bankName}\n${createdAccount.accountNumber}`,
                  )
                }
              >
                <Icons.Copy className="size-3.5 mr-1.5" />
                Copy Account Details
              </Button>
            </SurfaceCard>

            <SheetFooter>
              <Button onClick={handleClose}>Done</Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AccountDetailView({ accountId }: { accountId: string }) {
  const trpc = useTRPC();

  const { data: account, isLoading: accountLoading } = useQuery(
    trpc.virtualAccounts.getById.queryOptions({ id: accountId }),
  );

  const { data: transactions = [], isLoading: txLoading } = useQuery(
    trpc.virtualAccounts.transactions.queryOptions({ virtualAccountId: accountId }),
  );

  if (accountLoading || !account) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-muted" />
        <div className="h-24 bg-muted" />
      </div>
    );
  }

  const statusKey = account.expired ? "expired" : account.status;
  const status = statusConfig[statusKey as keyof typeof statusConfig] ?? statusConfig.active;

  return (
    <div className="space-y-6">
      <SurfaceCard className="p-5">
        <div className="flex items-start justify-between mb-5">
          <h3 className="font-medium">Account Overview</h3>
          <Badge className={status.className}>{status.label}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-y-4 gap-x-8 mb-5">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Virtual Account Number</p>
            <p className="font-mono text-sm">{account.accountNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Account Name</p>
            <p className="text-sm font-medium">{account.accountName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Customer</p>
            <p className="text-sm">{account.customerName || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Bank</p>
            <p className="text-sm">{account.bankName || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Reference</p>
            <p className="text-sm font-mono">{account.accountRef}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Date Created</p>
            <p className="text-sm">{formatDisplayDate(account.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => copyText(account.accountNumber)}>
            <Icons.Copy className="size-3.5 mr-1.5" />
            Copy Account Number
          </Button>
        </div>
      </SurfaceCard>

      <KpiGrid className="grid-cols-4">
        <KpiCard
          label="Total Received"
          value={
            formatAmount({
              amount: toNumber(account.totalReceived),
              currency: account.currency,
              maximumFractionDigits: 0,
            }) ?? "—"
          }
        />
        <KpiCard label="Number of Transactions" value={String(account.transactionCount ?? 0)} />
        <KpiCard
          label="Last Payment"
          value={
            account.lastPaymentAmount != null
              ? formatAmount({
                  amount: toNumber(account.lastPaymentAmount),
                  currency: account.currency,
                  maximumFractionDigits: 0,
                }) ?? "—"
              : "—"
          }
          detail={account.lastTransactionAt ? formatRelativeTime(new Date(account.lastTransactionAt)) : undefined}
        />
        <KpiCard
          label="Pending Reconciliation"
          value={
            formatAmount({
              amount: toNumber(account.pendingReconciliationAmount),
              currency: account.currency,
              maximumFractionDigits: 0,
            }) ?? "—"
          }
          detail={`${account.pendingReconciliationCount ?? 0} transactions`}
        />
      </KpiGrid>

      <SurfaceCard>
        <SurfaceCardHeader>
          <h3 className="font-medium">Transactions</h3>
        </SurfaceCardHeader>
        {txLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No transactions yet for this account.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Transaction ID</TableHead>
                <TableHead className="w-[160px]">Sender</TableHead>
                <TableHead className="w-[120px]">Amount</TableHead>
                <TableHead className="w-[110px]">Status</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[120px]">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const txStatus = mapTxStatus(tx);
                return (
                  <TableRow key={tx.id} className="h-[45px]">
                    <TableCell className="font-mono text-xs">{tx.nombaTransactionId.slice(0, 12)}</TableCell>
                    <TableCell>{tx.senderName || tx.senderBank || "-"}</TableCell>
                    <TableCell className="tabular-nums font-medium">
                      <FormatAmount amount={toNumber(tx.amount)} currency={tx.currency} maximumFractionDigits={0} />
                    </TableCell>
                    <TableCell>
                      <Badge className={TX_STATUS_STYLES[txStatus].className}>
                        {TX_STATUS_STYLES[txStatus].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={tx.type === "credit" ? "text-foreground" : "text-muted-foreground"}>
                        {tx.type === "credit" ? "Credit" : "Debit"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(new Date(tx.occurredAt))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SurfaceCard>
    </div>
  );
}

export default function VirtualAccountsPage() {
  const trpc = useTRPC();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showProvision, setShowProvision] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");

  const listInput = useMemo(
    () => ({
      q: search.trim() || undefined,
      status:
        statusFilter === "all"
          ? undefined
          : (statusFilter as "active" | "suspended" | "closed" | "expired"),
      customerId: customerFilter === "all" ? undefined : customerFilter,
      pageSize: 50,
    }),
    [search, statusFilter, customerFilter],
  );

  const { data: summary, isPending: summaryPending } = useStableQuery(
    trpc.virtualAccounts.summary.queryOptions(),
  );

  const { data: listData, isPending: listPending, isError, error } = useStableQuery(
    trpc.virtualAccounts.list.queryOptions(listInput),
  );

  const { data: customersData } = useQuery(
    trpc.customers.get.queryOptions({ pageSize: 100 }),
  );

  const accounts = listData?.data ?? [];
  const customers = customersData?.data ?? [];

  if (selectedId) {
    return (
      <ScrollableContent>
        <div className="flex flex-col">
          <div className="flex items-center justify-between pb-4 pt-6">
            <div>
              <h1 className="text-xl font-semibold">Virtual Accounts</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and monitor all dedicated virtual accounts provisioned for customers.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}>
              <Icons.ChevronLeft className="size-4 mr-1" />
              Back to accounts
            </Button>
          </div>
          <AccountDetailView accountId={selectedId} />
        </div>
      </ScrollableContent>
    );
  }

  return (
    <ScrollableContent>
      <div className="flex flex-col">
        <div className="flex items-start justify-between pb-6 pt-6">
          <div>
            <h1 className="text-xl font-semibold">Virtual Accounts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and monitor all dedicated virtual accounts provisioned for customers.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowProvision(true)}>
            <Icons.Add className="size-4 mr-1" />
            Provision Account
          </Button>
        </div>

        <ProvisionSheet
          open={showProvision}
          onOpenChange={setShowProvision}
          onCreated={() => {}}
        />

        {isError ? (
          <EmptyState
            className="py-24"
            icon={<Icons.Add className="size-5 text-muted-foreground" />}
            title="Could not load virtual accounts"
            description={error?.message ?? "Check that the API is running."}
          />
        ) : listPending && accounts.length === 0 ? (
          <VirtualAccountsTableSkeleton />
        ) : accounts.length === 0 && !search && statusFilter === "all" && customerFilter === "all" ? (
          <EmptyState
            className="py-24"
            icon={<Icons.Add className="size-5 text-muted-foreground" />}
            title="No virtual accounts yet"
            description="Provision your first dedicated virtual account to start receiving payments."
            action={{
              label: "Provision Account",
              onClick: () => setShowProvision(true),
              icon: <Icons.Add className="size-4 mr-1.5" />,
              size: "default",
            }}
          />
        ) : (
          <>
            {summaryPending ? (
              <KpiCardsSkeleton />
            ) : (
              <KpiGrid className="grid-cols-4">
                <KpiCard
                  label="Total Accounts"
                  value={String(summary?.totalCount ?? 0)}
                />
                <KpiCard
                  label="Active Accounts"
                  value={String(summary?.activeCount ?? 0)}
                />
                <KpiCard
                  label="Suspended Accounts"
                  value={String(summary?.suspendedCount ?? 0)}
                />
                <KpiCard
                  label="Total Inflow Today"
                  value={
                    formatAmount({
                      amount: summary?.inflowToday ?? 0,
                      currency: summary?.currency ?? "NGN",
                      maximumFractionDigits: 0,
                    }) ?? "—"
                  }
                />
              </KpiGrid>
            )}

            <div className="flex items-center gap-3 mb-4 mt-6">
              <div className="relative w-full max-w-[280px]">
                <Icons.Search className="absolute pointer-events-none left-3 top-[11px] size-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {accounts.length === 0 ? (
              <EmptyState
                className="py-16"
                icon={<Icons.Search className="size-5 text-muted-foreground" />}
                title="No matching accounts"
                description="Try adjusting your search or filters."
              />
            ) : (
              <SurfaceCard>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Account Name</TableHead>
                      <TableHead className="w-[160px]">Account Number</TableHead>
                      <TableHead className="w-[150px]">Bank</TableHead>
                      <TableHead className="w-[160px]">Customer</TableHead>
                      <TableHead className="w-[110px]">Status</TableHead>
                      <TableHead className="w-[130px]">Total Received</TableHead>
                      <TableHead className="w-[130px]">Last Transaction</TableHead>
                      <TableHead className="w-[100px]">Created</TableHead>
                      <TableHead className="w-[80px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => {
                      const statusKey = account.expired ? "expired" : account.status;
                      const status = statusConfig[statusKey as keyof typeof statusConfig] ?? statusConfig.active;

                      return (
                        <TableRow
                          key={account.id}
                          className="h-[45px] cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedId(account.id)}
                        >
                          <TableCell className="font-medium">{account.accountName}</TableCell>
                          <TableCell className="font-mono">{account.accountNumber}</TableCell>
                          <TableCell>{account.bankName || "-"}</TableCell>
                          <TableCell>{account.customerName || "-"}</TableCell>
                          <TableCell>
                            <Badge className={status.className}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            <FormatAmount
                              amount={toNumber(account.totalReceived)}
                              currency={account.currency}
                              maximumFractionDigits={0}
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {account.lastTransactionAt
                              ? formatRelativeTime(new Date(account.lastTransactionAt))
                              : "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDisplayDate(account.createdAt)}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="size-8 p-0">
                                  <DotsHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 bg-background border-border">
                                <DropdownMenuItem onClick={() => setSelectedId(account.id)}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copyText(account.accountNumber)}>
                                  Copy Account Number
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </SurfaceCard>
            )}
          </>
        )}
      </div>
    </ScrollableContent>
  );
}
