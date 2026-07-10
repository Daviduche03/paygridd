import { eq } from "drizzle-orm";
import { db } from "@/config/db";
import { businessKyc } from "@/db/schema";

export type KybStatus = "none" | "pending_review" | "approved" | "rejected";

export interface KycRecord {
  id: string;
  businessId: string;
  tier: "tier_1" | "tier_2" | "tier_3";
  kybStatus: KybStatus | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;

  rcNumber: string | null;
  cacDocumentUrl: string | null;
  directorName: string | null;
  directorPhone: string | null;
  businessAddressProofUrl: string | null;
  tier2SubmittedAt: string | null;
  tier2ApprovedAt: string | null;

  directorBvn: string | null;
  memorandumUrl: string | null;
  tier3SubmittedAt: string | null;
  tier3ApprovedAt: string | null;

  bvn: string | null;
  bvnVerifiedAt: string | null;
  idType: string | null;
  idNumber: string | null;
  idFrontUrl: string | null;
  idBackUrl: string | null;
  idVerifiedAt: string | null;
  addressProofUrl: string | null;
  addressVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type KybSubmission = {
  tier?: "tier_1" | "tier_2" | "tier_3";
  kybStatus?: KybStatus;
  rejectionReason?: string | null;
  reviewedBy?: string;
  reviewedAt?: string;

  rcNumber?: string;
  cacDocumentUrl?: string;
  directorName?: string;
  directorPhone?: string;
  businessAddressProofUrl?: string;
  tier2SubmittedAt?: string;
  tier2ApprovedAt?: string;

  directorBvn?: string;
  memorandumUrl?: string;
  tier3SubmittedAt?: string;
  tier3ApprovedAt?: string;
};

export const kycRepository = {
  async findByBusinessId(businessId: string): Promise<KycRecord | null> {
    const [record] = await db
      .select()
      .from(businessKyc)
      .where(eq(businessKyc.businessId, businessId));
    return (record as KycRecord) || null;
  },

  async upsert(
    businessId: string,
    data: KybSubmission,
  ): Promise<KycRecord> {
    const existing = await this.findByBusinessId(businessId);

    if (existing) {
      const [updated] = await db
        .update(businessKyc)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(businessKyc.businessId, businessId))
        .returning();
      return updated as KycRecord;
    }

    const [created] = await db
      .insert(businessKyc)
      .values({ businessId, ...data })
      .returning();
    return created as KycRecord;
  },
};
