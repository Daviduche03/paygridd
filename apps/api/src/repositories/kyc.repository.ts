import { db } from "@/config/db";
import { businessKyc } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface KycRecord {
  id: string;
  businessId: string;
  tier: "tier_1" | "tier_2" | "tier_3";
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
    data: Partial<{
      tier: "tier_1" | "tier_2" | "tier_3";
      bvn: string;
      bvnVerifiedAt: string;
      idType: string;
      idNumber: string;
      idFrontUrl: string;
      idBackUrl: string;
      idVerifiedAt: string;
      addressProofUrl: string;
      addressVerifiedAt: string;
    }>,
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
