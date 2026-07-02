CREATE TYPE "public"."virtual_account_kind" AS ENUM('static', 'dynamic');
ALTER TABLE "virtual_accounts" ADD COLUMN "kind" "virtual_account_kind" DEFAULT 'static' NOT NULL;
CREATE UNIQUE INDEX "virtual_accounts_active_static_customer_idx" ON "virtual_accounts" ("team_id", "customer_id") WHERE "kind" = 'static' AND "expired" = false AND "customer_id" IS NOT NULL;
