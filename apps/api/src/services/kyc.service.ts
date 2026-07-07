import { kycRepository } from "@/repositories/kyc.repository";

export interface TierLimits {
  dailyTransactionLimit: number;
  monthlyTransactionLimit: number;
  perTransactionLimit: number;
  maxBalance: number | null;
}

const TIER_LIMITS: Record<"tier_1" | "tier_2" | "tier_3", TierLimits> = {
  tier_1: {
    dailyTransactionLimit: 50_000,
    monthlyTransactionLimit: 300_000,
    perTransactionLimit: 10_000,
    maxBalance: 300_000,
  },
  tier_2: {
    dailyTransactionLimit: 500_000,
    monthlyTransactionLimit: 5_000_000,
    perTransactionLimit: 100_000,
    maxBalance: 5_000_000,
  },
  tier_3: {
    dailyTransactionLimit: 5_000_000,
    monthlyTransactionLimit: 50_000_000,
    perTransactionLimit: 1_000_000,
    maxBalance: null,
  },
};

interface KycStatus {
  tier: "tier_1" | "tier_2" | "tier_3";
  limits: TierLimits;
  bvn: { verified: boolean; value?: string };
  id: { verified: boolean; type?: string; number?: string };
  address: { verified: boolean };
  nextTier: "tier_2" | "tier_3" | null;
  requirements: { label: string; met: boolean }[];
}

export const kycService = {
  async getStatus(businessId: string): Promise<KycStatus> {
    const kyc = await kycRepository.findByBusinessId(businessId);
    const tier = kyc?.tier ?? "tier_1";

    const bvnVerified = !!kyc?.bvnVerifiedAt;
    const idVerified = !!kyc?.idVerifiedAt;
    const addressVerified = !!kyc?.addressVerifiedAt;

    let nextTier: KycStatus["nextTier"] = null;
    let requirements: { label: string; met: boolean }[] = [];

    if (tier === "tier_1") {
      nextTier = "tier_2";
      requirements = [{ label: "Provide BVN", met: bvnVerified }];
    } else if (tier === "tier_2") {
      nextTier = "tier_3";
      requirements = [
        { label: "Government-issued ID", met: idVerified },
        { label: "Proof of address", met: addressVerified },
      ];
    }

    return {
      tier,
      limits: TIER_LIMITS[tier],
      bvn: { verified: bvnVerified, value: kyc?.bvn ?? undefined },
      id: {
        verified: idVerified,
        type: kyc?.idType ?? undefined,
        number: kyc?.idNumber ?? undefined,
      },
      address: { verified: addressVerified },
      nextTier,
      requirements,
    };
  },

  async submitBvn(businessId: string, bvn: string): Promise<KycStatus> {
    const kyc = await kycRepository.upsert(businessId, {
      bvn,
      bvnVerifiedAt: new Date().toISOString(),
    });

    const newTier = kyc.tier === "tier_1" ? "tier_2" : kyc.tier;
    if (newTier !== kyc.tier) {
      await kycRepository.upsert(businessId, { tier: newTier });
    }

    return this.getStatus(businessId);
  },

  async submitId(
    businessId: string,
    data: {
      idType: string;
      idNumber: string;
      idFrontUrl: string;
      idBackUrl?: string;
    },
  ): Promise<KycStatus> {
    const kyc = await kycRepository.upsert(businessId, {
      idType: data.idType,
      idNumber: data.idNumber,
      idFrontUrl: data.idFrontUrl,
      idBackUrl: data.idBackUrl,
      idVerifiedAt: new Date().toISOString(),
    });

    const current = await this.getStatus(businessId);
    if (current.address.verified && kyc.tier === "tier_2") {
      await kycRepository.upsert(businessId, { tier: "tier_3" });
    }

    return this.getStatus(businessId);
  },

  async submitAddress(
    businessId: string,
    proofUrl: string,
  ): Promise<KycStatus> {
    const kyc = await kycRepository.upsert(businessId, {
      addressProofUrl: proofUrl,
      addressVerifiedAt: new Date().toISOString(),
    });

    const current = await this.getStatus(businessId);
    if (current.id.verified && kyc.tier === "tier_2") {
      await kycRepository.upsert(businessId, { tier: "tier_3" });
    }

    return this.getStatus(businessId);
  },
};
