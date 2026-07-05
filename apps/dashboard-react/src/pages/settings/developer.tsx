"use client";

import { useState } from "react";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import { Icons } from "ui/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
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
import { Checkbox } from "ui/checkbox";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { SettingsTabs } from "@/components/settings-tabs";
import { ScrollableContent } from "@/components/scrollable-content";
import { EmptyState } from "@/components/empty-state";
import { SurfaceCard } from "@/components/surface-card";
import { CopyInput } from "@/components/copy-input";
import { useTRPC, useTRPCClient } from "@/trpc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "ui/use-toast";

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

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-muted text-foreground border-transparent" },
  disabled: { label: "Disabled", className: "bg-muted text-muted-foreground border-transparent" },
};

const ALL_SCOPES = [
  { id: "transactions.read", label: "Transactions (read)" },
  { id: "transactions.write", label: "Transactions (write)" },
  { id: "invoices.read", label: "Invoices (read)" },
  { id: "invoices.write", label: "Invoices (write)" },
  { id: "customers.read", label: "Customers (read)" },
  { id: "customers.write", label: "Customers (write)" },
  { id: "business.read", label: "Business (read)" },
  { id: "business.write", label: "Business (write)" },
  { id: "webhook.read", label: "Webhook (read)" },
  { id: "webhook.write", label: "Webhook (write)" },
] as const;

export default function DeveloperPage() {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  // API Keys state
  const [createKeyOpen, setCreateKeyOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([]);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);

  const [editKeyOpen, setEditKeyOpen] = useState(false);
  const [editKeyId, setEditKeyId] = useState<string | null>(null);
  const [editKeyName, setEditKeyName] = useState("");
  const [editKeyScopes, setEditKeyScopes] = useState<string[]>([]);

  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  // Webhook state
  const [createWhOpen, setCreateWhOpen] = useState(false);
  const [newWhUrl, setNewWhUrl] = useState("");
  const [newWhDesc, setNewWhDesc] = useState("");
  const [newWhEvents, setNewWhEvents] = useState<string[]>([]);
  const [creatingWh, setCreatingWh] = useState(false);
  const [whRawSecret, setWhRawSecret] = useState<string | null>(null);

  const [editWhOpen, setEditWhOpen] = useState(false);
  const [editWhId, setEditWhId] = useState<string | null>(null);
  const [editWhUrl, setEditWhUrl] = useState("");
  const [editWhDesc, setEditWhDesc] = useState("");
  const [editWhEvents, setEditWhEvents] = useState<string[]>([]);

  const [deletingWh, setDeletingWh] = useState<string | null>(null);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);

  // Queries
  const { data: keysData, isLoading: keysLoading } = useQuery(
    trpc.apiKeys.list.queryOptions(),
  );
  const { data: webhooksData, isLoading: webhooksLoading } = useQuery(
    trpc.apiKeys.webhooks.queryOptions(),
  );
  const deliveriesQuery = useQuery({
    ...trpc.apiKeys.webhookDeliveries.queryOptions({ webhookId: selectedWebhookId ?? "" }),
    enabled: !!selectedWebhookId,
  });

  // Helpers
  const toggleScope = (scope: string, current: string[], setter: (v: string[]) => void) => {
    setter(current.includes(scope) ? current.filter((s) => s !== scope) : [...current, scope]);
  };

  const invalidateKeys = () => queryClient.invalidateQueries({ queryKey: trpc.apiKeys.list.queryKey() });
  const invalidateWebhooks = () => {
    queryClient.invalidateQueries({ queryKey: trpc.apiKeys.webhooks.queryKey() });
    queryClient.invalidateQueries({ queryKey: trpc.apiKeys.webhookDeliveries.queryKey() });
  };

  // API Key handlers
  const handleCreateKey = async () => {
    if (!newKeyName || creatingKey) return;
    setCreatingKey(true);
    try {
      const result = await trpcClient.apiKeys.create.mutate({ name: newKeyName, scopes: newKeyScopes });
      setRawKey(result.rawKey);
      invalidateKeys();
      toast({ title: "API key created" });
    } catch (err) {
      toast({ title: "Failed to create API key", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
      setCreatingKey(false);
    }
  };

  const handleSaveKey = async () => {
    if (!editKeyId) return;
    try {
      await trpcClient.apiKeys.update.mutate({ id: editKeyId, name: editKeyName, scopes: editKeyScopes });
      invalidateKeys();
      toast({ title: "API key updated" });
      setEditKeyOpen(false);
    } catch (err) {
      toast({ title: "Failed to update API key", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    }
  };

  const handleDeleteKey = async (id: string) => {
    setDeletingKey(id);
    try {
      await trpcClient.apiKeys.remove.mutate({ id });
      invalidateKeys();
      toast({ title: "API key deleted" });
    } catch (err) {
      toast({ title: "Failed to delete API key", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setDeletingKey(null);
    }
  };

  // Webhook handlers
  const handleCreateWebhook = async () => {
    if (!newWhUrl || creatingWh) return;
    setCreatingWh(true);
    try {
      const result = await trpcClient.apiKeys.createWebhook.mutate({ url: newWhUrl, description: newWhDesc, events: newWhEvents });
      setWhRawSecret((result as any).rawSecret ?? "");
      invalidateWebhooks();
      toast({ title: "Webhook created" });
    } catch (err) {
      toast({ title: "Failed to create webhook", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
      setCreatingWh(false);
    }
  };

  const handleSaveWebhook = async () => {
    if (!editWhId) return;
    try {
      await trpcClient.apiKeys.updateWebhook.mutate({ id: editWhId, url: editWhUrl, description: editWhDesc, events: editWhEvents });
      invalidateWebhooks();
      toast({ title: "Webhook updated" });
      setEditWhOpen(false);
    } catch (err) {
      toast({ title: "Failed to update webhook", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    setDeletingWh(id);
    try {
      await trpcClient.apiKeys.removeWebhook.mutate({ id });
      invalidateWebhooks();
      toast({ title: "Webhook deleted" });
    } catch (err) {
      toast({ title: "Failed to delete webhook", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setDeletingWh(null);
    }
  };

  return (
    <ScrollableContent>
      <div className="pt-6">
        <SettingsTabs />

        <div className="space-y-12">
          {/* API Keys */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium">API Keys</h3>
              <Button size="sm" onClick={() => { setNewKeyName(""); setNewKeyScopes([]); setRawKey(null); setCreateKeyOpen(true); }}>
                Create API Key
              </Button>
            </div>

            {keysLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            ) : !keysData?.length ? (
              <EmptyState
                icon={<span className="text-lg font-mono text-muted-foreground">key</span>}
                title="No API keys yet"
                description="Create an API key to integrate with external services."
                action={{ label: "Create API Key", onClick: () => { setNewKeyName(""); setNewKeyScopes([]); setRawKey(null); setCreateKeyOpen(true); }, size: "default" }}
              />
            ) : (
              <SurfaceCard>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Prefix</TableHead>
                      <TableHead>Scopes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[70px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keysData.map((key) => (
                      <TableRow key={key.id} className="h-[45px]">
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{key.keyPrefix}...</code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {key.scopes.length === 0 ? (
                              <span className="text-xs text-muted-foreground">Full access</span>
                            ) : (
                              key.scopes.slice(0, 2).map((s) => (
                                <span key={s} className="text-xs bg-muted px-1.5 py-0.5 font-mono rounded">{s}</span>
                              ))
                            )}
                            {key.scopes.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{key.scopes.length - 2}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={key.active ? "bg-muted text-foreground border-transparent" : "bg-muted text-muted-foreground border-transparent"}>
                            {key.active ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{key.lastUsedAt ?? "Never"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{key.createdAt ? new Date(key.createdAt).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="size-8 p-0">
                                <DotsHorizontalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 bg-background border-border">
                              <DropdownMenuItem onClick={() => {
                                setEditKeyId(key.id); setEditKeyName(key.name); setEditKeyScopes(key.scopes); setEditKeyOpen(true);
                              }}>Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" disabled={deletingKey === key.id} onClick={() => handleDeleteKey(key.id)}>
                                {deletingKey === key.id ? "Deleting..." : "Delete"}
                              </DropdownMenuItem>
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

          {/* Webhooks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium">Webhooks</h3>
              <Button size="sm" onClick={() => { setNewWhUrl(""); setNewWhDesc(""); setNewWhEvents([]); setCreateWhOpen(true); }}>
                Add Endpoint
              </Button>
            </div>

            {webhooksLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            ) : !webhooksData?.length ? (
              <EmptyState
                icon={<span className="text-lg font-mono text-muted-foreground">/</span>}
                title="No webhooks yet"
                description="Create a webhook endpoint to start receiving real-time events."
                action={{ label: "Add Endpoint", onClick: () => { setNewWhUrl(""); setNewWhDesc(""); setNewWhEvents([]); setCreateWhOpen(true); }, size: "default" }}
              />
            ) : (
              <SurfaceCard>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">URL</TableHead>
                      <TableHead className="w-[160px]">Events</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[100px]">Created</TableHead>
                      <TableHead className="w-[70px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooksData.map((wh) => (
                      <TableRow key={wh.id} className="h-[45px] cursor-pointer hover:bg-muted/50" onClick={() => setSelectedWebhookId(wh.id)}>
                        <TableCell className="max-w-[300px]">
                          <p className="text-sm font-medium truncate">{wh.description || "Webhook"}</p>
                          <p className="text-xs font-mono text-muted-foreground truncate">{wh.url}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(wh.events ?? []).slice(0, 2).map((ev: string) => (
                              <span key={ev} className="text-xs bg-muted px-1.5 py-0.5 font-mono rounded">{ev}</span>
                            ))}
                            {(wh.events ?? []).length > 2 && (
                              <span className="text-xs text-muted-foreground">+{(wh.events ?? []).length - 2}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={wh.active ? "bg-muted text-foreground border-transparent" : "bg-muted text-muted-foreground border-transparent"}>
                            {wh.active ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{wh.createdAt ? new Date(wh.createdAt).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="size-8 p-0">
                                <DotsHorizontalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 bg-background border-border">
                              <DropdownMenuItem onClick={() => setSelectedWebhookId(wh.id)}>View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setEditWhId(wh.id); setEditWhUrl(wh.url); setEditWhDesc(wh.description ?? ""); setEditWhEvents(wh.events ?? []); setEditWhOpen(true);
                              }}>Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteWebhook(wh.id)} className="text-destructive">
                                Delete
                              </DropdownMenuItem>
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

        {/* Webhook Detail Modal */}
        {selectedWebhookId && webhooksData && (() => {
          const wh = webhooksData.find((w) => w.id === selectedWebhookId);
          if (!wh) return null;
          return (
            <WebhookDetailModal
              webhook={wh}
              deliveries={deliveriesQuery.data ?? []}
              loading={deliveriesQuery.isLoading}
              onClose={() => setSelectedWebhookId(null)}
            />
          );
        })()}

        {/* Create API Key Dialog */}
        <Dialog open={createKeyOpen} onOpenChange={(o) => { if (!o) { setCreateKeyOpen(false); setRawKey(null); } }}>
          <DialogContent className="max-w-[455px]">
            <div className="p-4 space-y-4">
              {rawKey ? (
                <>
                  <DialogHeader>
                    <DialogTitle>API Key Created</DialogTitle>
                    <DialogDescription>For security reasons, the key will only be shown once. Please copy and store it securely.</DialogDescription>
                  </DialogHeader>
                  <CopyInput value={rawKey} />
                  <DialogFooter>
                    <Button onClick={() => { setCreateKeyOpen(false); setRawKey(null); }} className="w-full">Done</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>Give your key a name and select the permissions it should have.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Label htmlFor="key-name">Key Name</Label>
                    <Input id="key-name" placeholder="e.g. Production API Key" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions (leave empty for full access)</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                      {ALL_SCOPES.map((scope) => (
                        <label key={scope.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={newKeyScopes.includes(scope.id)} onCheckedChange={() => toggleScope(scope.id, newKeyScopes, setNewKeyScopes)} />
                          {scope.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setCreateKeyOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateKey} disabled={!newKeyName || creatingKey}>{creatingKey ? "Creating..." : "Create"}</Button>
                  </DialogFooter>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit API Key Dialog */}
        <Dialog open={editKeyOpen} onOpenChange={(o) => { if (!o) setEditKeyOpen(false); }}>
          <DialogContent className="max-w-[455px]">
            <div className="p-4 space-y-4">
              <DialogHeader>
                <DialogTitle>Edit API Key</DialogTitle>
                <DialogDescription>Update the name or permissions for this key.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Label htmlFor="edit-key-name">Key Name</Label>
                <Input id="edit-key-name" value={editKeyName} onChange={(e) => setEditKeyName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                  {ALL_SCOPES.map((scope) => (
                    <label key={scope.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={editKeyScopes.includes(scope.id)} onCheckedChange={() => toggleScope(scope.id, editKeyScopes, setEditKeyScopes)} />
                      {scope.label}
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setEditKeyOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveKey}>Save</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Webhook Dialog */}
        <Dialog open={createWhOpen} onOpenChange={(o) => { if (!o) { setCreateWhOpen(false); setWhRawSecret(null); } }}>
          <DialogContent className="max-w-[455px]">
            <div className="p-4 space-y-4">
              {whRawSecret ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Webhook Created</DialogTitle>
                    <DialogDescription>
                      Your webhook endpoint has been created. The signing secret below is used to verify that payloads originate from PayGrid.
                      For security reasons, it will only be shown once.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="wh-secret">Signing Secret</Label>
                    <CopyInput id="wh-secret" value={whRawSecret} />
                  </div>
                  <DialogFooter>
                    <Button onClick={() => { setCreateWhOpen(false); setWhRawSecret(null); }} className="w-full">Done</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Add Webhook Endpoint</DialogTitle>
                    <DialogDescription>Enter the URL where events should be sent.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Label htmlFor="wh-url">URL</Label>
                    <Input id="wh-url" placeholder="https://api.example.com/webhooks" value={newWhUrl} onChange={(e) => setNewWhUrl(e.target.value)} />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="wh-desc">Description (optional)</Label>
                    <Input id="wh-desc" placeholder="e.g. Payment notifications" value={newWhDesc} onChange={(e) => setNewWhDesc(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Events</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                      {WEBHOOK_EVENTS.map((ev) => (
                        <label key={ev} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={newWhEvents.includes(ev)} onCheckedChange={() => toggleScope(ev, newWhEvents, setNewWhEvents)} />
                          {ev}
                        </label>
                      ))}
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => { setCreateWhOpen(false); setWhRawSecret(null); }}>Cancel</Button>
                    <Button onClick={handleCreateWebhook} disabled={!newWhUrl || creatingWh}>{creatingWh ? "Creating..." : "Create"}</Button>
                  </DialogFooter>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Webhook Dialog */}
        <Dialog open={editWhOpen} onOpenChange={(o) => { if (!o) setEditWhOpen(false); }}>
          <DialogContent className="max-w-[455px]">
            <div className="p-4 space-y-4">
              <DialogHeader>
                <DialogTitle>Edit Webhook</DialogTitle>
                <DialogDescription>Update the URL, description, or subscribed events.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Label htmlFor="edit-wh-url">URL</Label>
                <Input id="edit-wh-url" value={editWhUrl} onChange={(e) => setEditWhUrl(e.target.value)} />
              </div>
              <div className="space-y-3">
                <Label htmlFor="edit-wh-desc">Description</Label>
                <Input id="edit-wh-desc" value={editWhDesc} onChange={(e) => setEditWhDesc(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Events</Label>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                  {WEBHOOK_EVENTS.map((ev) => (
                    <label key={ev} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={editWhEvents.includes(ev)} onCheckedChange={() => toggleScope(ev, editWhEvents, setEditWhEvents)} />
                      {ev}
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setEditWhOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveWebhook}>Save</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollableContent>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-muted text-muted-foreground border-transparent" },
    delivered: { label: "Delivered", className: "bg-emerald-500/10 text-emerald-600 border-transparent" },
    failed: { label: "Failed", className: "bg-red-500/10 text-red-600 border-transparent" },
    retrying: { label: "Retrying", className: "bg-amber-500/10 text-amber-600 border-transparent" },
  };
  const s = styles[status] ?? { label: status, className: "bg-muted text-muted-foreground border-transparent" };
  return <Badge className={s.className}>{s.label}</Badge>;
}

function WebhookDetailModal({ webhook, deliveries, loading, onClose }: { webhook: any; deliveries: any[]; loading: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">{webhook.description || "Webhook"}</h3>
            <p className="text-sm font-mono text-muted-foreground mt-0.5 truncate">{webhook.url}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <Badge className={webhook.active ? "bg-muted text-foreground border-transparent" : "bg-muted text-muted-foreground border-transparent"}>
              {webhook.active ? "Active" : "Disabled"}
            </Badge>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <Icons.Close className="size-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-border">
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="text-muted-foreground">Events: <span className="text-foreground font-mono">{(webhook.events ?? []).length > 0 ? (webhook.events ?? []).join(", ") : "All"}</span></span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <h4 className="text-sm font-medium">Delivery History</h4>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : deliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deliveries yet. Deliveries will appear here when events are sent to this endpoint.</p>
          ) : (
            <div className="space-y-2">
              {deliveries.map((d: any) => (
                <div key={d.id} className="flex items-start gap-4 p-3 rounded-md bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={d.status} />
                      <span className="text-xs font-mono text-foreground">{d.eventType}</span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">{JSON.stringify(d.payload)}</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      {d.responseCode && <span>HTTP {d.responseCode}</span>}
                      {d.attempts > 0 && <span>Attempts: {d.attempts}/{d.maxAttempts ?? 5}</span>}
                    </div>
                    {d.responseBody && (
                      <details className="mt-1">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Response</summary>
                        <pre className="text-xs font-mono text-muted-foreground mt-1 p-2 bg-muted/50 rounded max-h-24 overflow-y-auto">{d.responseBody}</pre>
                      </details>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{d.createdAt ? new Date(d.createdAt).toLocaleString() : "—"}</p>
                    {d.nextRetryAt && d.status !== "delivered" && (
                      <p className="text-xs text-muted-foreground mt-1">Next retry: {new Date(d.nextRetryAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
