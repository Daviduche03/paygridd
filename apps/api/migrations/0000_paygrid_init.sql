CREATE TYPE "public"."team_role" AS ENUM('owner', 'admin', 'member');
CREATE TYPE "public"."virtual_account_status" AS ENUM('active', 'suspended', 'closed', 'expired');
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'scheduled', 'unpaid', 'overdue', 'paid', 'canceled', 'refunded');
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'posted', 'failed', 'reversed');
CREATE TYPE "public"."reconciliation_status" AS ENUM('pending', 'matched', 'underpaid', 'overpaid', 'duplicate', 'needs_review');
CREATE TYPE "public"."transaction_type" AS ENUM('credit', 'debit');

CREATE TABLE "teams" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "base_currency" text DEFAULT 'NGN' NOT NULL,
  "country_code" text DEFAULT 'NG' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "full_name" text,
  "avatar_url" text,
  "team_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "users_on_team" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "team_id" uuid NOT NULL,
  "role" "team_role" DEFAULT 'member' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "customers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL,
  "name" text NOT NULL,
  "email" text,
  "phone" text,
  "billing_email" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "virtual_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL,
  "customer_id" uuid,
  "account_ref" text NOT NULL,
  "account_name" text NOT NULL,
  "account_number" text NOT NULL,
  "bank_name" text,
  "currency" text DEFAULT 'NGN' NOT NULL,
  "nomba_account_holder_id" text,
  "status" "virtual_account_status" DEFAULT 'active' NOT NULL,
  "expired" boolean DEFAULT false NOT NULL,
  "expected_amount" numeric(14, 2),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL,
  "customer_id" uuid,
  "virtual_account_id" uuid,
  "invoice_number" text NOT NULL,
  "amount" numeric(14, 2) NOT NULL,
  "amount_paid" numeric(14, 2) DEFAULT '0' NOT NULL,
  "currency" text DEFAULT 'NGN' NOT NULL,
  "status" "invoice_status" DEFAULT 'draft' NOT NULL,
  "issue_date" timestamp with time zone,
  "due_date" timestamp with time zone,
  "paid_at" timestamp with time zone,
  "line_items" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL,
  "virtual_account_id" uuid,
  "customer_id" uuid,
  "invoice_id" uuid,
  "nomba_transaction_id" text NOT NULL,
  "nomba_request_id" text,
  "event_type" text,
  "type" "transaction_type" DEFAULT 'credit' NOT NULL,
  "amount" numeric(14, 2) NOT NULL,
  "currency" text DEFAULT 'NGN' NOT NULL,
  "status" "transaction_status" DEFAULT 'pending' NOT NULL,
  "reconciliation_status" "reconciliation_status" DEFAULT 'pending' NOT NULL,
  "sender_name" text,
  "sender_bank" text,
  "narration" text,
  "occurred_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid,
  "request_id" text NOT NULL,
  "event_type" text NOT NULL,
  "payload" jsonb NOT NULL,
  "transaction_id" uuid,
  "processed_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "users" ADD CONSTRAINT "users_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "users_on_team" ADD CONSTRAINT "users_on_team_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "users_on_team" ADD CONSTRAINT "users_on_team_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "customers" ADD CONSTRAINT "customers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "virtual_accounts" ADD CONSTRAINT "virtual_accounts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "virtual_accounts" ADD CONSTRAINT "virtual_accounts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_virtual_account_id_virtual_accounts_id_fk" FOREIGN KEY ("virtual_account_id") REFERENCES "public"."virtual_accounts"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_virtual_account_id_virtual_accounts_id_fk" FOREIGN KEY ("virtual_account_id") REFERENCES "public"."virtual_accounts"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;

CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
CREATE UNIQUE INDEX "users_on_team_user_team_idx" ON "users_on_team" USING btree ("user_id","team_id");
CREATE INDEX "customers_team_id_idx" ON "customers" USING btree ("team_id");
CREATE INDEX "virtual_accounts_team_id_idx" ON "virtual_accounts" USING btree ("team_id");
CREATE UNIQUE INDEX "virtual_accounts_account_ref_idx" ON "virtual_accounts" USING btree ("account_ref");
CREATE UNIQUE INDEX "virtual_accounts_account_number_idx" ON "virtual_accounts" USING btree ("account_number");
CREATE INDEX "invoices_team_id_idx" ON "invoices" USING btree ("team_id");
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");
CREATE INDEX "transactions_team_id_idx" ON "transactions" USING btree ("team_id");
CREATE UNIQUE INDEX "transactions_team_nomba_tx_idx" ON "transactions" USING btree ("team_id","nomba_transaction_id");
CREATE UNIQUE INDEX "webhook_events_request_id_idx" ON "webhook_events" USING btree ("request_id");
