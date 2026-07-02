"use client";

import { useState } from "react";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import { Icons } from "ui/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "ui/table";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { SettingsTabs } from "@/components/settings-tabs";
import { ScrollableContent } from "@/components/scrollable-content";
import { EmptyState } from "@/components/empty-state";
import { SurfaceCard, SurfaceCardHeader } from "@/components/surface-card";
import { CreateApiKeyModal } from "@/components/modals/create-api-key-modal";
import { DeleteApiKeyModal } from "@/components/modals/delete-api-key-modal";
import { EditApiKeyModal } from "@/components/modals/edit-api-key-modal";
import { DataTable } from "@/components/tables/api-keys";

const WEBHOOK_EVENTS = [
  "payment.received",
  "payment.reversed",
  "payment.failed",
  "invoice.created",
  "invoice.paid",
  "invoice.overdue",
  "reconciliation.completed",
  "customer.created",
  "account.provisioned",
  "account.suspended",
] as const;

type WebhookStatus = "active" | "disabled" | "failing";

type Webhook = {
  id: string;
  url: string;
  description: string;
  events: string[];
  status: WebhookStatus;
  lastTriggered: string;
  lastSuccess: string;
  createdAt: string;
};

const MOCK_WEBHOOKS: Webhook[] = [
  { id: "wh_001", url: "https://api.acmecorp.com/webhooks/payments", description: "Payment notifications", events: ["payment.received", "payment.reversed", "payment.failed"], status: "active", lastTriggered: "2 mins ago", lastSuccess: "2 mins ago", createdAt: "Jan 15, 2026" },
  { id: "wh_002", url: "https://hooks.graceltd.com/invoice-events", description: "Invoice updates", events: ["invoice.created", "invoice.paid", "invoice.overdue"], status: "active", lastTriggered: "1 hour ago", lastSuccess: "1 hour ago", createdAt: "Feb 3, 2026" },
  { id: "wh_003", url: "https://webhooks.abcventures.ng/recon", description: "Reconciliation alerts", events: ["reconciliation.completed", "payment.received"], status: "disabled", lastTriggered: "3 days ago", lastSuccess: "2 weeks ago", createdAt: "Dec 20, 2025" },
  { id: "wh_004", url: "https://api.techstart.io/hooks", description: "Customer & account events", events: ["customer.created", "account.provisioned", "account.suspended"], status: "failing", lastTriggered: "5 hours ago", lastSuccess: "3 days ago", createdAt: "Nov 10, 2025" },
];

const STATUS_STYLES: Record<WebhookStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-muted text-foreground border-transparent" },
  disabled: { label: "Disabled", className: "bg-muted text-muted-foreground border-transparent" },
  failing: { label: "Failing", className: "bg-muted text-foreground border-transparent" },
};

export default function DeveloperPage() {
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);

  return (
    <ScrollableContent>
      <div className="pt-6">
        <SettingsTabs />

        <div className="space-y-12">
          {/* API Keys */}
          <DataTable />

          {/* Webhooks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium">Webhooks</h3>
              <Button size="sm">Add Endpoint</Button>
            </div>
            {MOCK_WEBHOOKS.length === 0 ? (
              <EmptyState
                icon={<span className="text-lg font-mono text-muted-foreground">/</span>}
                title="No webhooks yet"
                description="Create a webhook endpoint to start receiving real-time events."
                action={{ label: "Add Endpoint", onClick: () => {}, size: "default" }}
              />
            ) : (
              <SurfaceCard>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">URL</TableHead>
                      <TableHead className="w-[160px]">Events</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[130px]">Last Triggered</TableHead>
                      <TableHead className="w-[100px]">Created</TableHead>
                      <TableHead className="w-[70px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_WEBHOOKS.map((wh) => (
                      <TableRow
                        key={wh.id}
                        className="h-[45px] cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedWebhook(wh)}
                      >
                        <TableCell className="max-w-[300px]">
                          <p className="text-sm font-medium truncate">{wh.description}</p>
                          <p className="text-xs font-mono text-muted-foreground truncate">{wh.url}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {wh.events.slice(0, 2).map((ev) => (
                              <span key={ev} className="text-xs bg-muted px-1.5 py-0.5 font-mono rounded">{ev}</span>
                            ))}
                            {wh.events.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{wh.events.length - 2}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_STYLES[wh.status].className}>
                            {STATUS_STYLES[wh.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{wh.lastTriggered}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{wh.createdAt}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="size-8 p-0">
                                <DotsHorizontalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 bg-background border-border">
                              <DropdownMenuItem onClick={() => setSelectedWebhook(wh)}>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>Test</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {wh.status === "active" ? (
                                <DropdownMenuItem>Disable</DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem>Enable</DropdownMenuItem>
                              )}
                              <DropdownMenuItem>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SurfaceCard>
            )}
          </div>
        </div>

        {selectedWebhook && (
          <WebhookDetailModal webhook={selectedWebhook} onClose={() => setSelectedWebhook(null)} />
        )}

        <EditApiKeyModal />
        <DeleteApiKeyModal />
        <CreateApiKeyModal />
      </div>
    </ScrollableContent>
  );
}

function WebhookDetailModal({ webhook, onClose }: { webhook: Webhook; onClose: () => void }) {
  const recentEvents = [
    { event: "payment.received", status: "success" as const, time: "2 mins ago", payload: '{ "type": "payment.received", "data": { "amount": 50000 } }' },
    { event: "payment.received", status: "success" as const, time: "1 hour ago", payload: '{ "type": "payment.received", "data": { "amount": 25000 } }' },
    { event: "payment.received", status: "failed" as const, time: "5 hours ago", payload: '{ "type": "payment.received", "data": { "amount": 80000 } }' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">{webhook.description}</h3>
            <p className="text-sm font-mono text-muted-foreground mt-0.5 truncate">{webhook.url}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <Badge className={STATUS_STYLES[webhook.status].className}>
              {STATUS_STYLES[webhook.status].label}
            </Badge>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <Icons.Close className="size-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <h4 className="text-sm font-medium">Recent Deliveries</h4>
          {recentEvents.map((ev, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-md bg-muted/30">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-foreground">{ev.event}</p>
                <p className="text-xs font-mono text-muted-foreground truncate mt-1">{ev.payload}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-xs font-medium ${ev.status === 'failed' ? 'text-red-500' : 'text-green-600'}`}>
                  {ev.status}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{ev.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          <Button size="sm">Edit Endpoint</Button>
        </div>
      </div>
    </div>
  );
}
