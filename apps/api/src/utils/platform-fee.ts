import { env } from "@/config/env";

export function resolvePlatformChargeRate(
  businessRate: string | number | null | undefined,
): number {
  const parsed = Number(businessRate ?? 0);
  if (parsed > 0) return parsed;
  return env.PLATFORM_FEE_RATE;
}

export function calculatePlatformFee(
  amount: number,
  businessRate?: string | number | null,
): { platformFee: number; netAmount: number; rate: number } {
  const rate = resolvePlatformChargeRate(businessRate);
  const platformFee = Math.round(amount * rate) / 100;
  const netAmount = amount - platformFee;

  return { platformFee, netAmount, rate };
}