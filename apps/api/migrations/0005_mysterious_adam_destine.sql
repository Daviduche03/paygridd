CREATE TYPE "public"."kyc_tier" AS ENUM('tier_1', 'tier_2', 'tier_3');--> statement-breakpoint
CREATE TABLE "business_kyc" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"tier" "kyc_tier" DEFAULT 'tier_1' NOT NULL,
	"bvn" text,
	"bvn_verified_at" timestamp with time zone,
	"id_type" text,
	"id_number" text,
	"id_front_url" text,
	"id_back_url" text,
	"id_verified_at" timestamp with time zone,
	"address_proof_url" text,
	"address_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_kyc_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
ALTER TABLE "business_kyc" ADD CONSTRAINT "business_kyc_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;