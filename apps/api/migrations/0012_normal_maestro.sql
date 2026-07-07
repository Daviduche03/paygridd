ALTER TABLE "businesses" ADD COLUMN "platform_charge_rate" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "platform_fee" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "net_amount" numeric(14, 2) DEFAULT '0' NOT NULL;