CREATE TABLE "statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"total_invoiced" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_paid" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_outstanding" numeric(14, 2) DEFAULT '0' NOT NULL,
	"invoice_count" integer DEFAULT 0 NOT NULL,
	"file_url" text,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "statements" ADD CONSTRAINT "statements_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statements" ADD CONSTRAINT "statements_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "statements_business_id_idx" ON "statements" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "statements_customer_id_idx" ON "statements" USING btree ("customer_id");