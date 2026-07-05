import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const businessRoleEnum = pgEnum("business_role", ["owner", "admin", "member"]);

export const kycTierEnum = pgEnum("kyc_tier", ["tier_1", "tier_2", "tier_3"]);

export const virtualAccountStatusEnum = pgEnum("virtual_account_status", [
  "active",
  "suspended",
  "closed",
  "expired",
]);

export const virtualAccountKindEnum = pgEnum("virtual_account_kind", [
  "static",
  "dynamic",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "scheduled",
  "unpaid",
  "overdue",
  "paid",
  "canceled",
  "refunded",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "posted",
  "failed",
  "reversed",
]);

export const reconciliationStatusEnum = pgEnum("reconciliation_status", [
  "pending",
  "matched",
  "underpaid",
  "overpaid",
  "duplicate",
  "needs_review",
]);

export const transactionTypeEnum = pgEnum("transaction_type", ["credit", "debit"]);

export const businesses = pgTable("businesses", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: text().notNull(),
  baseCurrency: text("base_currency").default("NGN").notNull(),
  countryCode: text("country_code").default("NG").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    email: text().notNull(),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    businessId: uuid("business_id").references(() => businesses.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const usersOnBusiness = pgTable(
  "users_on_business",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    role: businessRoleEnum().default("member").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_on_business_user_business_idx").on(
      table.userId,
      table.businessId,
    ),
  ],
);

export const businessKyc = pgTable("business_kyc", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" })
    .unique(),
  tier: kycTierEnum().default("tier_1").notNull(),
  bvn: text(),
  bvnVerifiedAt: timestamp("bvn_verified_at", { withTimezone: true, mode: "string" }),
  idType: text("id_type"),
  idNumber: text("id_number"),
  idFrontUrl: text("id_front_url"),
  idBackUrl: text("id_back_url"),
  idVerifiedAt: timestamp("id_verified_at", { withTimezone: true, mode: "string" }),
  addressProofUrl: text("address_proof_url"),
  addressVerifiedAt: timestamp("address_verified_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const customers = pgTable(
  "customers",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text().notNull(),
    email: text(),
    phone: text(),
    billingEmail: text("billing_email"),
    country: text(),
    countryCode: text("country_code"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("customers_business_id_idx").on(table.businessId)],
);

export const virtualAccounts = pgTable(
  "virtual_accounts",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    kind: virtualAccountKindEnum().default("static").notNull(),
    accountRef: text("account_ref").notNull(),
    accountName: text("account_name").notNull(),
    accountNumber: text("account_number").notNull(),
    bankName: text("bank_name"),
    currency: text().default("NGN").notNull(),
    nombaAccountHolderId: text("nomba_account_holder_id"),
    status: virtualAccountStatusEnum().default("active").notNull(),
    expired: boolean().default(false).notNull(),
    expectedAmount: numeric("expected_amount", { precision: 14, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("virtual_accounts_business_id_idx").on(table.businessId),
    uniqueIndex("virtual_accounts_account_ref_idx").on(table.accountRef),
    uniqueIndex("virtual_accounts_account_number_idx").on(table.accountNumber),
  ],
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    virtualAccountId: uuid("virtual_account_id").references(() => virtualAccounts.id, {
      onDelete: "set null",
    }),
    invoiceNumber: text("invoice_number").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    amountPaid: numeric("amount_paid", { precision: 14, scale: 2 }).default("0").notNull(),
    currency: text().default("NGN").notNull(),
    status: invoiceStatusEnum().default("draft").notNull(),
    issueDate: timestamp("issue_date", { withTimezone: true, mode: "string" }),
    dueDate: timestamp("due_date", { withTimezone: true, mode: "string" }),
    paidAt: timestamp("paid_at", { withTimezone: true, mode: "string" }),
    lineItems: jsonb("line_items"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("invoices_business_id_idx").on(table.businessId),
    index("invoices_status_idx").on(table.status),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    virtualAccountId: uuid("virtual_account_id").references(() => virtualAccounts.id, {
      onDelete: "set null",
    }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    invoiceId: uuid("invoice_id").references(() => invoices.id, {
      onDelete: "set null",
    }),
    nombaTransactionId: text("nomba_transaction_id").notNull(),
    nombaRequestId: text("nomba_request_id"),
    eventType: text("event_type"),
    type: transactionTypeEnum().default("credit").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: text().default("NGN").notNull(),
    status: transactionStatusEnum().default("pending").notNull(),
    reconciliationStatus: reconciliationStatusEnum("reconciliation_status")
      .default("pending")
      .notNull(),
    senderName: text("sender_name"),
    senderBank: text("sender_bank"),
    narration: text(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("transactions_business_id_idx").on(table.businessId),
    uniqueIndex("transactions_business_nomba_tx_idx").on(
      table.businessId,
      table.nombaTransactionId,
    ),
  ],
);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending",
  "delivered",
  "failed",
  "retrying",
]);

export const webhooks = pgTable(
  "webhooks",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    url: text().notNull(),
    description: text().default("").notNull(),
    events: text("events").array().notNull().default([]),
    active: boolean().default(true).notNull(),
    signingSecret: text("signing_secret").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("webhooks_business_id_idx").on(table.businessId)],
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    businessId: uuid("business_id").references(() => businesses.id, {
      onDelete: "set null",
    }),
    requestId: text("request_id").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    transactionId: uuid("transaction_id").references(() => transactions.id, {
      onDelete: "set null",
    }),
    processedAt: timestamp("processed_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("webhook_events_request_id_idx").on(table.requestId)],
);

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    webhookId: uuid("webhook_id")
      .notNull()
      .references(() => webhooks.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    status: deliveryStatusEnum().default("pending").notNull(),
    responseCode: integer("response_code"),
    responseBody: text("response_body"),
    attempts: integer().default(0).notNull(),
    maxAttempts: integer("max_attempts").default(5).notNull(),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("webhook_deliveries_webhook_id_idx").on(table.webhookId),
    index("webhook_deliveries_business_id_idx").on(table.businessId),
    index("webhook_deliveries_status_idx").on(table.status),
  ],
);

export const invoiceNumberSequences = pgTable(
  "invoice_number_sequences",
  {
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
    year: integer("year").notNull(),
    lastNumber: integer("last_number").default(0).notNull(),
  },
  (table) => [primaryKey({ columns: [table.businessId, table.year] })],
);

export const inviteStatusEnum = pgEnum("invite_status", ["pending", "accepted", "declined", "expired"]);

export const businessInvites = pgTable(
  "business_invites",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    email: text().notNull(),
    role: businessRoleEnum().default("member").notNull(),
    status: inviteStatusEnum().default("pending").notNull(),
    invitedBy: uuid("invited_by").references(() => users.id),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("business_invites_business_id_idx").on(table.businessId),
    uniqueIndex("business_invites_business_email_idx").on(table.businessId, table.email),
  ],
);

export const apiKeyScopeEnum = pgEnum("api_key_scope", [
  "transactions.read",
  "transactions.write",
  "invoices.read",
  "invoices.write",
  "customers.read",
  "customers.write",
  "business.read",
  "business.write",
  "webhook.read",
  "webhook.write",
]);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text().notNull(),
    keyPrefix: text("key_prefix").notNull(),
    keyHash: text("key_hash").notNull(),
    scopes: text("scopes").array().notNull().default([]),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "string" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    active: boolean().default(true).notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("api_keys_business_id_idx").on(table.businessId),
    index("api_keys_key_hash_idx").on(table.keyHash),
  ],
);

export const businessesRelations = relations(businesses, ({ many, one }) => ({
  users: many(users),
  members: many(usersOnBusiness),
  invites: many(businessInvites),
  customers: many(customers),
  virtualAccounts: many(virtualAccounts),
  invoices: many(invoices),
  transactions: many(transactions),
  kyc: one(businessKyc),
  apiKeys: many(apiKeys),
  webhooks: many(webhooks),
  webhookDeliveries: many(webhookDeliveries),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  business: one(businesses, {
    fields: [users.businessId],
    references: [businesses.id],
  }),
  memberships: many(usersOnBusiness),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  business: one(businesses, {
    fields: [customers.businessId],
    references: [businesses.id],
  }),
  virtualAccounts: many(virtualAccounts),
  invoices: many(invoices),
  transactions: many(transactions),
}));

export const virtualAccountsRelations = relations(virtualAccounts, ({ one, many }) => ({
  business: one(businesses, {
    fields: [virtualAccounts.businessId],
    references: [businesses.id],
  }),
  customer: one(customers, {
    fields: [virtualAccounts.customerId],
    references: [customers.id],
  }),
  transactions: many(transactions),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  business: one(businesses, {
    fields: [invoices.businessId],
    references: [businesses.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  virtualAccount: one(virtualAccounts, {
    fields: [invoices.virtualAccountId],
    references: [virtualAccounts.id],
  }),
  transactions: many(transactions),
}));

export const businessKycRelations = relations(businessKyc, ({ one }) => ({
  business: one(businesses, {
    fields: [businessKyc.businessId],
    references: [businesses.id],
  }),
}));

export const webhooksRelations = relations(webhooks, ({ one, many }) => ({
  business: one(businesses, {
    fields: [webhooks.businessId],
    references: [businesses.id],
  }),
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  webhook: one(webhooks, {
    fields: [webhookDeliveries.webhookId],
    references: [webhooks.id],
  }),
  business: one(businesses, {
    fields: [webhookDeliveries.businessId],
    references: [businesses.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  business: one(businesses, {
    fields: [apiKeys.businessId],
    references: [businesses.id],
  }),
  creator: one(users, {
    fields: [apiKeys.createdBy],
    references: [users.id],
  }),
}));

export const businessInvitesRelations = relations(businessInvites, ({ one }) => ({
  business: one(businesses, {
    fields: [businessInvites.businessId],
    references: [businesses.id],
  }),
  inviter: one(users, {
    fields: [businessInvites.invitedBy],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  business: one(businesses, {
    fields: [transactions.businessId],
    references: [businesses.id],
  }),
  virtualAccount: one(virtualAccounts, {
    fields: [transactions.virtualAccountId],
    references: [virtualAccounts.id],
  }),
  customer: one(customers, {
    fields: [transactions.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [transactions.invoiceId],
    references: [invoices.id],
  }),
}));
