CREATE TYPE "public"."kyb_status" AS ENUM('none', 'pending_review', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "business_kyc" ADD COLUMN "kyb_status" "kyb_status" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "business_kyc" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "business_kyc" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "business_kyc" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "business_kyc" ADD COLUMN "rc_number" text;--> statement-breakpoint
ALTER TABLE "business_kyc" ADD COLUMN "cac_document_url" text;--> statement-breakpoint
ALTER TABLE "business_kyc" ADD COLUMN "director_name" text;--> statement-breakpoint
ALTER TABLE "business_kyc" ADD COLUMN "director_phone" text;--> statement-breakpoint
ALTER TABLE "business_kyc" ADD COLUMN "business_address_proof_url" text;--> statement-breakpoint
ALTER TABLE "business_kyc" ADD COLUMN "tier_2_submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "business_kyc" ADD COLUMN "tier_2_approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "business_kyc" ADD COLUMN "director_bvn" text;--> statement-breakpoint
ALTER TABLE "business_kyc" ADD COLUMN "memorandum_url" text;--> statement-breakpoint
ALTER TABLE "business_kyc" ADD COLUMN "tier_3_submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "business_kyc" ADD COLUMN "tier_3_approved_at" timestamp with time zone;