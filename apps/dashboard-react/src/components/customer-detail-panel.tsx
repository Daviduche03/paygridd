"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "ui/use-toast";
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
  TabsContent,
  TabsList,
  TabsTrigger,
} from "ui/tabs";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import { Icons } from "ui/icons";
import { Skeleton } from "ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { format } from "date-fns";
import { useState } from "react";
import { FormatAmount } from "./format-amount";
import { SurfaceCard } from "@/components/surface-card";

function ProfileTab({ customerId }: { customerId: string }) {
  const trpc = useTRPC();
  const { data: customer, isLoading, isError } = useQuery({
    ...trpc.customers.getById.queryOptions({ id: customerId }),
    enabled: Boolean(customerId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <p className="text-sm text-muted-foreground">Customer not found.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b border-border">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center text-lg font-medium">
          {customer.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-base font-medium">{customer.name}</h3>
          {customer.email && (
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Email</p>
          <p className="text-sm">{customer.email || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Billing email</p>
          <p className="text-sm">{customer.billingEmail || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Phone</p>
          <p className="text-sm">{customer.phone || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Country</p>
          <p className="text-sm">{customer.country || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Created</p>
          <p className="text-sm">
            {customer.createdAt
              ? format(new Date(customer.createdAt), "MMM d, yyyy")
              : "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

function VirtualAccountTab({ customerId }: { customerId: string }) {
  const trpc = useTRPC();
  const [showAssign, setShowAssign] = useState(false);

  const { data, isLoading } = useQuery({
    ...trpc.virtualAccounts.list.queryOptions({ customerId, pageSize: 50 }),
    enabled: Boolean(customerId),
  });

  const virtualAccounts = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-20" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between border border-border p-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Virtual accounts assigned to this customer
        </p>
        <Button size="sm" onClick={() => setShowAssign(!showAssign)}>
          <Icons.Add className="size-4 mr-1" />
          Assign
        </Button>
      </div>

      {showAssign && (
        <div className="border border-border p-4 space-y-3 bg-muted/30">
          <p className="text-sm font-medium">Assign Virtual Account</p>
          <div className="grid grid-cols-2 gap-3">
            <select className="flex h-9 w-full rounded-sm border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              <option>Select bank</option>
              <option>GTBank</option>
              <option>Access Bank</option>
              <option>Zenith Bank</option>
            </select>
            <select className="flex h-9 w-full rounded-sm border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              <option>NGN</option>
              <option>USD</option>
            </select>
          </div>
          <Button size="sm" className="mt-2">Assign Account</Button>
        </div>
      )}

      {virtualAccounts.length > 0 ? (
        <div className="space-y-2">
          {virtualAccounts.map((va) => (
            <div
              key={va.id}
              className="flex items-center justify-between border border-border p-3"
            >
              <div>
                <p className="text-sm font-medium">{va.bankName || va.accountName}</p>
                <p className="text-xs text-muted-foreground">
                  {va.accountNumber} · {va.currency}
                </p>
              </div>
              <Badge
                variant={va.status === "active" ? "default" : "secondary"}
              >
                {va.status}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 border border-dashed border-border text-sm text-muted-foreground">
          No virtual accounts assigned
        </div>
      )}
    </div>
  );
}

function PaymentHistoryTab({ customerId }: { customerId: string }) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.invoice.get.queryOptions({
      customers: [customerId],
      pageSize: 20,
    }),
  );

  const payments = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 border border-dashed border-border text-sm text-muted-foreground">
        No payment history yet
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">Invoice</TableHead>
          <TableHead className="text-xs">Date</TableHead>
          <TableHead className="text-xs">Amount</TableHead>
          <TableHead className="text-xs">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((inv: any) => (
          <TableRow key={inv.id}>
            <TableCell className="text-sm">
              {inv.invoiceNumber || "Draft"}
            </TableCell>
            <TableCell className="text-sm">
              {inv.issueDate
                ? (() => { try { return format(new Date(inv.issueDate), "MMM d, yyyy"); } catch { return "-"; } })()
                : "-"}
            </TableCell>
            <TableCell className="text-sm">
              {inv.amount != null ? (
                <FormatAmount amount={inv.amount} currency={inv.currency || "USD"} />
              ) : "-"}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  inv.status === "paid"
                    ? "default"
                    : inv.status === "overdue"
                      ? "destructive"
                      : "secondary"
                }
              >
                {inv.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StatementsTab({ customerId }: { customerId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: statements, isLoading } = useQuery({
    ...trpc.statements.list.queryOptions({ customerId }),
    enabled: Boolean(customerId),
  });

  const generateMutation = useMutation(
    trpc.statements.generate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.statements.list.queryKey({ customerId }) });
        toast({ title: "Statement generated" });
      },
      onError: (err) => {
        toast({ title: "Failed to generate statement", description: err.message, variant: "destructive" });
      },
    }),
  );

  const handleGenerate = () => {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = now.toISOString();
    generateMutation.mutate({ customerId, periodStart, periodEnd });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between border border-border p-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="size-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Account statements for this customer
        </p>
        <Button size="sm" onClick={handleGenerate} disabled={generateMutation.isPending}>
          <Icons.Add className="size-4 mr-1" />
          {generateMutation.isPending ? "Generating..." : "Generate"}
        </Button>
      </div>

      {statements && statements.length > 0 ? (
        <div className="space-y-2">
          {statements.map((stmt) => (
            <div
              key={stmt.id}
              className="flex items-center justify-between border border-border p-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {format(new Date(stmt.periodStart), "MMM yyyy")} - {format(new Date(stmt.periodEnd), "MMM yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Generated {format(new Date(stmt.generatedAt), "MMM d, yyyy")} · {stmt.invoiceCount} invoices
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium tabular-nums">
                  <FormatAmount amount={Number(stmt.totalInvoiced)} currency="NGN" />
                </span>
                <Button variant="outline" size="icon" className="size-8">
                  <Icons.ArrowCoolDown className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 border border-dashed border-border text-sm text-muted-foreground">
          No statements yet. Click "Generate" to create one.
        </div>
      )}
    </div>
  );
}

type Props = {
  customerId: string;
  onBack: () => void;
};

export function CustomerDetailPanel({ customerId, onBack }: Props) {
  return (
    <SurfaceCard>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto">
          <TabsTrigger
            value="profile"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="virtual-account"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm"
          >
            Virtual Account
          </TabsTrigger>
          <TabsTrigger
            value="payment-history"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm"
          >
            Payment History
          </TabsTrigger>
          <TabsTrigger
            value="statements"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm"
          >
            Statements
          </TabsTrigger>
        </TabsList>

        <div className="p-6">
          <TabsContent value="profile" className="mt-0">
            <ProfileTab customerId={customerId} />
          </TabsContent>
          <TabsContent value="virtual-account" className="mt-0">
            <VirtualAccountTab customerId={customerId} />
          </TabsContent>
          <TabsContent value="payment-history" className="mt-0">
            <PaymentHistoryTab customerId={customerId} />
          </TabsContent>
          <TabsContent value="statements" className="mt-0">
            <StatementsTab customerId={customerId} />
          </TabsContent>
        </div>
      </Tabs>
    </SurfaceCard>
  );
}
