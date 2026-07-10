import { kycRepository } from "@/repositories/kyc.repository";
import type { KybSubmission, KybStatus } from "@/repositories/kyc.repository";

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

interface KybStatusResponse {
  tier: "tier_1" | "tier_2" | "tier_3";
  status: KybStatus;
  limits: TierLimits;
  rejectionReason?: string;
  tier2: {
    submitted: boolean;
    approvedAt?: string;
    data?: {
      rcNumber?: string;
      directorName?: string;
      directorPhone?: string;
    };
  };
  tier3: {
    submitted: boolean;
    approvedAt?: string;
    data?: {
      directorBvn?: string;
    };
  };
  nextTier: "tier_2" | "tier_3" | null;
}

export const kycService = {
  async getStatus(businessId: string): Promise<KybStatusResponse> {
    const kyc = await kycRepository.findByBusinessId(businessId);
    const tier = (kyc?.tier ?? "tier_1") as "tier_1" | "tier_2" | "tier_3";
    const status = (kyc?.kybStatus ?? "none") as KybStatus;

    const tier2Submitted = !!kyc?.tier2SubmittedAt;
    const tier2Approved = !!kyc?.tier2ApprovedAt;
    const tier3Submitted = !!kyc?.tier3SubmittedAt;
    const tier3Approved = !!kyc?.tier3ApprovedAt;

    let nextTier: "tier_2" | "tier_3" | null = null;

    if (tier === "tier_1" && status !== "approved") {
      nextTier = "tier_2";
    } else if (tier === "tier_2" && status !== "approved") {
      nextTier = "tier_3";
    }

    return {
      tier,
      status,
      limits: TIER_LIMITS[tier],
      rejectionReason: kyc?.rejectionReason ?? undefined,
      tier2: {
        submitted: tier2Submitted,
        approvedAt: kyc?.tier2ApprovedAt ?? undefined,
        data: {
          rcNumber: kyc?.rcNumber ?? undefined,
          directorName: kyc?.directorName ?? undefined,
          directorPhone: kyc?.directorPhone ?? undefined,
        },
      },
      tier3: {
        submitted: tier3Submitted,
        approvedAt: kyc?.tier3ApprovedAt ?? undefined,
        data: {
          directorBvn: kyc?.directorBvn ?? undefined,
        },
      },
      nextTier,
    };
  },

  async submitTier2(
    businessId: string,
    data: {
      rcNumber: string;
      cacDocumentUrl: string;
      directorName: string;
      directorPhone: string;
      businessAddressProofUrl: string;
    },
  ): Promise<KybStatusResponse> {
    await kycRepository.upsert(businessId, {
      rcNumber: data.rcNumber,
      cacDocumentUrl: data.cacDocumentUrl,
      directorName: data.directorName,
      directorPhone: data.directorPhone,
      businessAddressProofUrl: data.businessAddressProofUrl,
      tier2SubmittedAt: new Date().toISOString(),
      kybStatus: "pending_review",
      rejectionReason: null,
    });

    return this.getStatus(businessId);
  },

  async submitTier3(
    businessId: string,
    data: {
      directorBvn: string;
      memorandumUrl: string;
    },
  ): Promise<KybStatusResponse> {
    await kycRepository.upsert(businessId, {
      directorBvn: data.directorBvn,
      memorandumUrl: data.memorandumUrl,
      tier3SubmittedAt: new Date().toISOString(),
      kybStatus: "pending_review",
      rejectionReason: null,
    });

    return this.getStatus(businessId);
  },

  async approveTier2(
    businessId: string,
    reviewerId: string,
  ): Promise<KybStatusResponse> {
    const kyc = await kycRepository.upsert(businessId, {
      kybStatus: "approved",
      tier2ApprovedAt: new Date().toISOString(),
      tier: "tier_2",
      reviewedBy: reviewerId,
      reviewedAt: new Date().toISOString(),
      rejectionReason: null,
    });

    return this.getStatus(businessId);
  },

  async approveTier3(
    businessId: string,
    reviewerId: string,
  ): Promise<KybStatusResponse> {
    const kyc = await kycRepository.upsert(businessId, {
      kybStatus: "approved",
      tier3ApprovedAt: new Date().toISOString(),
      tier: "tier_3",
      reviewedBy: reviewerId,
      reviewedAt: new Date().toISOString(),
      rejectionReason: null,
    });

    return this.getStatus(businessId);
  },

  async reject(
    businessId: string,
    reviewerId: string,
    reason: string,
  ): Promise<KybStatusResponse> {
    await kycRepository.upsert(businessId, {
      kybStatus: "rejected",
      rejectionReason: reason,
      reviewedBy: reviewerId,
      reviewedAt: new Date().toISOString(),
    });

    return this.getStatus(businessId);
  },
};
