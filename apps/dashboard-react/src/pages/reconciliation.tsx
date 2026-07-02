"use client";

import { useState } from "react";
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
import { EmptyState } from "@/components/empty-state";
import { ScrollableContent } from "@/components/scrollable-content";
import { KpiCard, KpiGrid, SurfaceCard } from "@/components/surface-card";

const RECON_STATUS_STYLES = {
  matched: { label: "Matched", icon: "✅", className: "bg-muted text-foreground border-transparent" },
  pending: { label: "Pending", icon: "🟡", className: "bg-muted text-muted-foreground border-transparent" },
  underpaid: { label: "Underpaid", icon: "🟠", className: "bg-muted text-foreground border-transparent" },
  overpaid: { label: "Overpaid", icon: "🔵", className: "bg-muted text-foreground border-transparent" },
  duplicate: { label: "Duplicate", icon: "🔴", className: "bg-muted text-foreground border-transparent" },
  needs_review: { label: "Needs Review", icon: "⚪", className: "bg-muted text-muted-foreground border-transparent" },
} as const;

type RecoItem = {
  id: string;
  transactionRef: string;
  invoice: string;
  customer: string;
  invoiceAmount: number;
  paymentAmount: number;
  difference: number;
  status: keyof typeof RECON_STATUS_STYLES;
  date: string;
};

const MOCK_ITEMS: RecoItem[] = [
  { id: "R-001", transactionRef: "TXN-001", invoice: "INV-1001", customer: "David Uche", invoiceAmount: 50000, paymentAmount: 50000, difference: 0, status: "matched", date: "Today" },
  { id: "R-002", transactionRef: "TXN-002", invoice: "INV-1002", customer: "Grace Ltd", invoiceAmount: 80000, paymentAmount: 45000, difference: -35000, status: "underpaid", date: "Yesterday" },
  { id: "R-003", transactionRef: "TXN-003", invoice: "INV-1003", customer: "ABC Ventures", invoiceAmount: 120000, paymentAmount: 120000, difference: 0, status: "duplicate", date: "Yesterday" },
  { id: "R-004", transactionRef: "TXN-004", invoice: "INV-1004", customer: "TechStart Inc", invoiceAmount: 250000, paymentAmount: 0, difference: -250000, status: "pending", date: "Mar 25" },
  { id: "R-005", transactionRef: "TXN-005", invoice: "INV-1005", customer: "Old Ventures Ltd", invoiceAmount: 75000, paymentAmount: 80000, difference: 5000, status: "overpaid", date: "Mar 24" },
  { id: "R-006", transactionRef: "TXN-006", invoice: "INV-1006", customer: "Euro Imports", invoiceAmount: 180000, paymentAmount: 180000, difference: 0, status: "matched", date: "Mar 22" },
  { id: "R-007", transactionRef: "TXN-007", invoice: "INV-1007", customer: "Greenfield Agro", invoiceAmount: 95000, paymentAmount: 50000, difference: -45000, status: "underpaid", date: "Mar 20" },
  { id: "R-008", transactionRef: "TXN-008", invoice: "INV-1008", customer: "Swift Logistics", invoiceAmount: 60000, paymentAmount: 0, difference: -60000, status: "needs_review", date: "Mar 18" },
];

const KPI_CARDS = [
  { label: "Pending", value: "12", className: "" },
  { label: "Matched", value: "156", className: "" },
  { label: "Discrepancies", value: "8", className: "" },
  { label: "Resolved Today", value: "24", className: "" },
];

function RecoDetailView({ item, onBack }: { item: RecoItem; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <SurfaceCard className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-medium">Reconciliation #{item.id}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{item.transactionRef} / {item.invoice}</p>
          </div>
          <Badge className={RECON_STATUS_STYLES[item.status].className}>
            {RECON_STATUS_STYLES[item.status].icon} {RECON_STATUS_STYLES[item.status].label}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-y-4 gap-x-8 mb-5">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Transaction</p>
            <p className="font-mono text-sm">{item.transactionRef}</p>
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
            <p className="text-sm font-medium tabular-nums">₦{item.invoiceAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Payment Amount</p>
            <p className="text-sm font-medium tabular-nums">₦{item.paymentAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Difference</p>
            <p className="text-sm font-medium tabular-nums text-foreground">
              {item.difference >= 0 ? "+" : ""}₦{item.difference.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <Badge className={RECON_STATUS_STYLES[item.status].className}>
              {RECON_STATUS_STYLES[item.status].label}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Date</p>
            <p className="text-sm">{item.date}</p>
          </div>
        </div>
      </SurfaceCard>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">Retry Match</Button>
        <Button variant="outline" size="sm">Mark as Resolved</Button>
        <Button variant="outline" size="sm">Notify Customer</Button>
      </div>

      <Button variant="ghost" size="sm" onClick={onBack}>
        <Icons.ChevronLeft className="size-4 mr-1" />
        Back to reconciliation
      </Button>
    </div>
  );
}

export default function ReconciliationPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedItem = MOCK_ITEMS.find((i) => i.id === selectedId);

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

        {MOCK_ITEMS.length === 0 ? (
          <EmptyState
            icon={<Icons.Check className="size-5 text-muted-foreground" />}
            title="All caught up"
            description="No pending reconciliation items. All transactions have been matched."
          />
        ) : (
          <>
            <KpiGrid className="grid-cols-4">
              {KPI_CARDS.map((kpi) => (
                <KpiCard
                  key={kpi.label}
                  label={kpi.label}
                  value={kpi.value}
                  valueClassName={kpi.className}
                />
              ))}
            </KpiGrid>

            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-full max-w-[280px]">
                <Icons.Search className="absolute pointer-events-none left-3 top-[11px] size-4 text-muted-foreground" />
                <Input placeholder="Search by invoice or transaction..." className="pl-9" />
              </div>
              <Select>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="underpaid">Underpaid</SelectItem>
                  <SelectItem value="overpaid">Overpaid</SelectItem>
                  <SelectItem value="duplicate">Duplicate</SelectItem>
                  <SelectItem value="needs_review">Needs Review</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Customer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="david">David Uche</SelectItem>
                  <SelectItem value="grace">Grace Ltd</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <SurfaceCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Transaction</TableHead>
                    <TableHead className="w-[110px]">Invoice</TableHead>
                    <TableHead className="w-[140px]">Customer</TableHead>
                    <TableHead className="w-[120px]">Invoice Amt</TableHead>
                    <TableHead className="w-[120px]">Payment Amt</TableHead>
                    <TableHead className="w-[110px]">Difference</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[70px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_ITEMS.map((item) => (
                    <TableRow
                      key={item.id}
                      className="h-[45px] cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedId(item.id)}
                    >
                      <TableCell className="font-mono text-xs">{item.transactionRef}</TableCell>
                      <TableCell className="font-mono text-xs">{item.invoice}</TableCell>
                      <TableCell>{item.customer}</TableCell>
                      <TableCell className="tabular-nums">₦{item.invoiceAmount.toLocaleString()}</TableCell>
                      <TableCell className="tabular-nums">₦{item.paymentAmount.toLocaleString()}</TableCell>
                      <TableCell className="tabular-nums font-medium text-foreground">
                        {item.difference >= 0 ? "+" : ""}₦{item.difference.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={RECON_STATUS_STYLES[item.status].className}>
                          {RECON_STATUS_STYLES[item.status].icon} {RECON_STATUS_STYLES[item.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.date}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="size-8 p-0">
                              <DotsHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-background border-border">
                            <DropdownMenuItem onClick={() => setSelectedId(item.id)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Retry Match</DropdownMenuItem>
                            <DropdownMenuItem>Mark Resolved</DropdownMenuItem>
                            <DropdownMenuItem>Notify Customer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SurfaceCard>
          </>
        )}
      </div>
    </ScrollableContent>
  );
}
