"use client";

import type { RouterOutputs } from "api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { useToast } from "ui/use-toast";
import { FormatAmount } from "@/components/format-amount";
import { EmptyState } from "@/components/empty-state";
import { ScrollableContent } from "@/components/scrollable-content";
import { KpiCard, KpiGrid, SurfaceCard, SurfaceCardHeader } from "@/components/surface-card";
import { InvoicesKpiSkeleton, InvoicesTableSkeleton } from "@/components/invoices-skeleton";
import { InvoiceDetailsSkeleton } from "@/components/invoice-details-skeleton";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useStableQuery } from "@/hooks/use-stable-query";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";

type InvoiceRow = RouterOutputs["invoice"]["get"]["data"][number];

const INVOICE_STATUS_STYLES = {
  paid: { label: "Paid", className: "bg-muted text-foreground border-transparent" },
  unpaid: { label: "Unpaid", className: "bg-muted text-muted-foreground border-transparent" },
  overdue: { label: "Overdue", className: "bg-muted text-foreground border-transparent" },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-transparent" },
  scheduled: { label: "Scheduled", className: "bg-muted text-foreground border-transparent" },
  canceled: { label: "Canceled", className: "bg-muted text-muted-foreground border-transparent" },
  refunded: { label: "Refunded", className: "bg-muted text-muted-foreground border-transparent" },
} as const;

const PAYMENT_STATUS_STYLES = {
  matched: { label: "Matched", icon: "✅", className: "bg-muted text-foreground border-transparent" },
  pending: { label: "Pending", icon: "🟡", className: "bg-muted text-muted-foreground border-transparent" },
  partial: { label: "Partial", icon: "🟠", className: "bg-muted text-foreground border-transparent" },
  none: { label: "No Payment", icon: "⚪", className: "bg-muted text-muted-foreground border-transparent" },
} as const;

function getInvoiceStatusStyle(status: string) {
  if (status in INVOICE_STATUS_STYLES) {
    return INVOICE_STATUS_STYLES[status as keyof typeof INVOICE_STATUS_STYLES];
  }
  return INVOICE_STATUS_STYLES.unpaid;
}

function getPaymentStatusStyle(status: string) {
  if (status in PAYMENT_STATUS_STYLES) {
    return PAYMENT_STATUS_STYLES[status as keyof typeof PAYMENT_STATUS_STYLES];
  }
  return PAYMENT_STATUS_STYLES.none;
}

function InvoiceDetailView({
  invoiceId,
  onBack,
}: {
  invoiceId: string;
  onBack: () => void;
}) {
  const trpc = useTRPC();
  const { setParams } = useInvoiceParams();

  const { data: invoice, isLoading } = useStableQuery(
    trpc.invoice.getById.queryOptions({ id: invoiceId }),
  );

  if (isLoading) {
    return <InvoiceDetailsSkeleton />;
  }

  if (!invoice) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Invoice not found.
      </div>
    );
  }

  const balanceDue = Math.max(invoice.amount - invoice.amountPaid, 0);
  const lineItems = (invoice.lineItems ?? []).length
    ? (invoice.lineItems ?? []).map((item) => ({
        description: item.name ?? "Line item",
        quantity: item.quantity ?? 1,
        unitPrice: item.price ?? 0,
        total: (item.quantity ?? 1) * (item.price ?? 0),
      }))
    : [
        {
          description: "Invoice total",
          quantity: 1,
          unitPrice: invoice.amount,
          total: invoice.amount,
        },
      ];

  return (
    <div className="space-y-6">
      <SurfaceCard className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-medium">{invoice.invoiceNumber}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {invoice.customerName ?? "-"}
            </p>
          </div>
          <Badge className={getInvoiceStatusStyle(invoice.status).className}>
            {getInvoiceStatusStyle(invoice.status).label}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-y-4 gap-x-8 mb-5">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Customer</p>
            <p className="text-sm">{invoice.customerName ?? "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Virtual Account</p>
            <p className="text-sm">{invoice.virtualAccount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
            <Badge className={getPaymentStatusStyle(invoice.paymentStatus).className}>
              {getPaymentStatusStyle(invoice.paymentStatus).icon}{" "}
              {getPaymentStatusStyle(invoice.paymentStatus).label}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Issue Date</p>
            <p className="text-sm">{invoice.issueDateDisplay ?? invoice.issueDate}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Due Date</p>
            <p className="text-sm">{invoice.dueDateDisplay ?? invoice.dueDate}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Last Activity</p>
            <p className="text-sm">{invoice.lastActivity}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" disabled>
            <Icons.Copy className="size-3.5 mr-1.5" />
            Copy Invoice Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setParams({ invoiceType: "edit", invoiceId: invoice.id })}
          >
            Edit Invoice
          </Button>
        </div>
      </SurfaceCard>

      <KpiGrid className="grid-cols-4">
        <KpiCard
          label="Invoice Amount"
          value={
            formatAmount({
              currency: invoice.currency,
              amount: invoice.amount,
              maximumFractionDigits: 0,
            }) ?? "—"
          }
        />
        <KpiCard
          label="Amount Paid"
          value={
            formatAmount({
              currency: invoice.currency,
              amount: invoice.amountPaid,
              maximumFractionDigits: 0,
            }) ?? "—"
          }
        />
        <KpiCard
          label="Balance Due"
          value={
            formatAmount({
              currency: invoice.currency,
              amount: balanceDue,
              maximumFractionDigits: 0,
            }) ?? "—"
          }
        />
        <KpiCard label="Line Items" value={String(lineItems.length)} />
      </KpiGrid>

      <SurfaceCard>
        <SurfaceCardHeader>
          <h3 className="font-medium">Line Items</h3>
        </SurfaceCardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Description</TableHead>
              <TableHead className="w-[100px]">Qty</TableHead>
              <TableHead className="w-[130px]">Unit Price</TableHead>
              <TableHead className="w-[130px]">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((item, index) => (
              <TableRow key={`${item.description}-${index}`} className="h-[45px]">
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell className="tabular-nums">
                  <FormatAmount amount={item.unitPrice} currency={invoice.currency} />
                </TableCell>
                <TableCell className="tabular-nums font-medium">
                  <FormatAmount amount={item.total} currency={invoice.currency} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SurfaceCard>

      {invoice.payments.length > 0 && (
        <SurfaceCard>
          <SurfaceCardHeader>
            <h3 className="font-medium">Payment History</h3>
          </SurfaceCardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Reference</TableHead>
                <TableHead className="w-[120px]">Amount</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[120px]">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.payments.map((payment) => (
                <TableRow key={payment.reference} className="h-[45px]">
                  <TableCell className="font-mono text-xs">{payment.reference}</TableCell>
                  <TableCell className="tabular-nums font-medium">
                    <FormatAmount amount={payment.amount} currency={payment.currency} />
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium capitalize">{payment.status}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{payment.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SurfaceCard>
      )}

      <div className="flex items-center gap-2">
        {invoice.status !== "paid" && invoice.status !== "canceled" && (
          <>
            <Button variant="outline" size="sm" disabled>
              Send Reminder
            </Button>
            <Button variant="outline" size="sm" disabled>
              Mark as Paid
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" disabled>
          Download PDF
        </Button>
      </div>

      <Button variant="ghost" size="sm" onClick={onBack}>
        <Icons.ChevronLeft className="size-4 mr-1" />
        Back to invoices
      </Button>
    </div>
  );
}

export default function InvoicesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { setParams } = useInvoiceParams();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [customerId, setCustomerId] = useState<string>("all");
  const [dueFilter, setDueFilter] = useState<string>("all");

  const listInput = useMemo(
    () => ({
      q: q.trim() || undefined,
      statuses:
        status === "all"
          ? undefined
          : [status],
      customers: customerId === "all" ? undefined : [customerId],
      dueFilter:
        dueFilter === "all"
          ? undefined
          : (dueFilter as "overdue" | "week" | "month"),
      pageSize: 50,
    }),
    [q, status, customerId, dueFilter],
  );

  const { data: summary, isLoading: summaryLoading } = useStableQuery(
    trpc.invoice.summary.queryOptions(),
  );

  const { data: listResult, isLoading: listLoading, isFetching } = useStableQuery(
    trpc.invoice.get.queryOptions(listInput),
  );

  const { data: customersData } = useQuery(
    trpc.customers.get.queryOptions({ pageSize: 100 }),
  );

  const invoices = listResult?.data ?? [];
  const customers = customersData?.data ?? [];
  const currency = summary?.currency ?? "NGN";
  const isLoading = summaryLoading || listLoading;
  const hasFilters =
    q.trim().length > 0 ||
    status !== "all" ||
    customerId !== "all" ||
    dueFilter !== "all";

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: trpc.invoice.summary.queryKey() });
    queryClient.invalidateQueries({ queryKey: trpc.invoice.get.queryKey() });
  };

  const handleCopyNumber = async (invoiceNumber: string) => {
    await navigator.clipboard.writeText(invoiceNumber);
    toast({ title: "Invoice number copied" });
  };

  if (selectedId) {
    return (
      <ScrollableContent>
        <div className="flex flex-col">
          <div className="flex items-center justify-between pb-4 pt-6">
            <div>
              <h1 className="text-xl font-semibold">Invoices</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create, send, and track invoices with automatic payment reconciliation.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}>
              <Icons.ChevronLeft className="size-4 mr-1" />
              Back to invoices
            </Button>
          </div>
          <InvoiceDetailView invoiceId={selectedId} onBack={() => setSelectedId(null)} />
        </div>
      </ScrollableContent>
    );
  }

  return (
    <ScrollableContent>
      <div className="flex flex-col">
        <div className="flex items-start justify-between pb-6 pt-6">
          <div>
            <h1 className="text-xl font-semibold">Invoices</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create, send, and track invoices with automatic payment reconciliation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setParams({ invoiceType: "create" })}>
              <Icons.Add className="size-4 mr-1" />
              Create Invoice
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

        {!isLoading && invoices.length === 0 && !hasFilters ? (
          <EmptyState
            bordered={false}
            iconContainerClassName="size-16"
            icon={<Icons.ReceiptLong className="size-8 text-muted-foreground" />}
            title="No invoices yet"
            description="Create your first invoice to start tracking payments from customers."
            action={{
              label: "Create Invoice",
              onClick: () => setParams({ invoiceType: "create" }),
              icon: <Icons.Add className="size-3.5 mr-1.5" />,
              size: "default",
            }}
          />
        ) : (
          <>
            {summaryLoading ? (
              <InvoicesKpiSkeleton />
            ) : (
              <KpiGrid className="grid-cols-6">
                <KpiCard
                  label="Total Invoices"
                  value={String(summary?.totalCount ?? 0)}
                />
                <KpiCard
                  label="Paid"
                  value={String(summary?.paidCount ?? 0)}
                />
                <KpiCard
                  label="Unpaid"
                  value={String(summary?.unpaidCount ?? 0)}
                />
                <KpiCard
                  label="Overdue"
                  value={String(summary?.overdueCount ?? 0)}
                />
                <KpiCard
                  label="Draft"
                  value={String(summary?.draftCount ?? 0)}
                />
                <KpiCard
                  label="Total Outstanding"
                  value={
                    formatAmount({
                      currency,
                      amount: summary?.totalOutstanding ?? 0,
                      maximumFractionDigits: 0,
                    }) ?? "—"
                  }
                />
              </KpiGrid>
            )}

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative w-full max-w-[280px]">
                <Icons.Search className="absolute pointer-events-none left-3 top-[11px] size-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  className="pl-9"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                />
              </div>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dueFilter} onValueChange={setDueFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Due Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="week">Due This Week</SelectItem>
                  <SelectItem value="month">Due This Month</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="ml-auto" disabled>
                Export
              </Button>
            </div>

            <SurfaceCard>
              {listLoading ? (
                <InvoicesTableSkeleton />
              ) : invoices.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">
                  No invoices match your filters.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Invoice No.</TableHead>
                      <TableHead className="w-[160px]">Customer</TableHead>
                      <TableHead className="w-[120px]">Amount</TableHead>
                      <TableHead className="w-[110px]">Status</TableHead>
                      <TableHead className="w-[140px]">Payment</TableHead>
                      <TableHead className="w-[120px]">Issue Date</TableHead>
                      <TableHead className="w-[120px]">Due Date</TableHead>
                      <TableHead className="w-[120px]">Last Activity</TableHead>
                      <TableHead className="w-[80px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice: InvoiceRow) => {
                      const invoiceStatus = getInvoiceStatusStyle(invoice.status);
                      const paymentStatus = getPaymentStatusStyle(invoice.paymentStatus);

                      return (
                        <TableRow
                          key={invoice.id}
                          className="h-[45px] cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedId(invoice.id)}
                        >
                          <TableCell className="font-mono text-xs">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell>{invoice.customerName ?? "-"}</TableCell>
                          <TableCell className="tabular-nums font-medium">
                            <FormatAmount amount={invoice.amount} currency={invoice.currency} />
                          </TableCell>
                          <TableCell>
                            <Badge className={invoiceStatus.className}>
                              {invoiceStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={paymentStatus.className}>
                              {paymentStatus.icon} {paymentStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {invoice.issueDate}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{invoice.dueDate}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {invoice.lastActivity}
                          </TableCell>
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
                                <DropdownMenuItem onClick={() => setSelectedId(invoice.id)}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setParams({
                                      invoiceType: "edit",
                                      invoiceId: invoice.id,
                                    })
                                  }
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled>Send Invoice</DropdownMenuItem>
                                <DropdownMenuItem disabled>Download PDF</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleCopyNumber(invoice.invoiceNumber)}
                                >
                                  Copy Invoice No.
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled>Cancel</DropdownMenuItem>
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
