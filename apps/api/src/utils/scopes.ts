export const SCOPES = [
  "apis.all",
  "apis.read",
  "bank-accounts.read",
  "bank-accounts.write",
  "customers.read",
  "customers.write",
  "documents.read",
  "documents.write",
  "inbox.read",
  "inbox.write",
  "invoices.read",
  "invoices.write",
  "transactions.read",
  "transactions.write",
  "businesses.read",
  "businesses.write",
  "users.read",
  "users.write",
  "tracker-entries.read",
  "tracker-entries.write",
  "tracker-projects.read",
  "tracker-projects.write",
  "tags.read",
  "tags.write",
  "reports.read",
  "search.read",
  "notifications.read",
  "notifications.write",
] as const;

export type Scope = (typeof SCOPES)[number];

export type ScopePreset = "all_access" | "read_only" | "restricted";

export const scopePresets = {
  all_access: { scopes: ["apis.all"] as Scope[], label: "All access", description: "full access to all resources" },
  read_only: { scopes: ["apis.read"] as Scope[], label: "Read only", description: "read-only access to all resources" },
  restricted: { scopes: [] as Scope[], label: "Restricted", description: "custom restricted access" },
};

const presetNames: Record<string, ScopePreset> = {
  "apis.all": "all_access",
  "apis.read": "read_only",
};

export function scopesToName(scopes: string[]) {
  const scope = scopes[0] ?? "";
  const preset = presetNames[scope] ?? "restricted";
  return { name: scopes.join(", "), preset };
}
