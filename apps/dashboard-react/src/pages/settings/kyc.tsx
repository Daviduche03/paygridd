"use client";

import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { useToast } from "ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Lock, Loader2 } from "lucide-react";
import { useState } from "react";
import { ScrollableContent } from "@/components/scrollable-content";
import { SettingsTabs } from "@/components/settings-tabs";
import { useTRPC } from "@/trpc/client";

const TIER_INFO: Record<string, { name: string; color: string; description: string }> = {
  tier_1: { name: "Tier 1", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300", description: "Basic" },
  tier_2: { name: "Tier 2", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", description: "BVN Verified" },
  tier_3: { name: "Tier 3", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", description: "Full KYC" },
};

function TierBadge({ tier }: { tier: string }) {
  const info = TIER_INFO[tier] ?? TIER_INFO.tier_1;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${info.color}`}>
      <Lock className="size-3" />
      {info.name} — {info.description}
    </span>
  );
}

function formatCurrency(n: number): string {
  return `₦${n.toLocaleString()}`;
}

export default function KycSettingsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: kyc, isLoading } = useQuery(trpc.kyc.status.queryOptions());

  const [bvn, setBvn] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idFrontUrl, setIdFrontUrl] = useState("");
  const [idBackUrl, setIdBackUrl] = useState("");
  const [addressProofUrl, setAddressProofUrl] = useState("");

  const submitBvn = useMutation({
    ...trpc.kyc.submitBvn.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.kyc.status.queryKey() });
        toast({ title: "BVN verified", description: "Your account has been upgraded to Tier 2" });
        setBvn("");
      },
      onError: (error: any) => {
        toast({ title: "Verification failed", description: error.message, variant: "info" });
      },
    }),
  });

  const submitId = useMutation({
    ...trpc.kyc.submitId.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.kyc.status.queryKey() });
        toast({ title: "ID submitted", description: "Your ID document has been submitted for verification" });
        setIdType("");
        setIdNumber("");
        setIdFrontUrl("");
        setIdBackUrl("");
      },
      onError: (error: any) => {
        toast({ title: "Submission failed", description: error.message, variant: "info" });
      },
    }),
  });

  const submitAddress = useMutation({
    ...trpc.kyc.submitAddress.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.kyc.status.queryKey() });
        toast({ title: "Address submitted", description: "Your address proof has been submitted for verification" });
        setAddressProofUrl("");
      },
      onError: (error: any) => {
        toast({ title: "Submission failed", description: error.message, variant: "info" });
      },
    }),
  });

  if (isLoading) {
    return (
      <ScrollableContent>
        <div className="pt-6">
          <SettingsTabs />
          <div className="space-y-8">
            <div className="border border-border rounded-md p-6 space-y-4">
              <div className="h-5 w-48 animate-pulse bg-muted rounded" />
              <div className="h-3 w-72 animate-pulse bg-muted rounded" />
              <div className="flex items-center gap-3">
                <div className="h-6 w-36 animate-pulse bg-muted rounded-full" />
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="border border-border rounded-md p-3 space-y-2">
                    <div className="h-3 w-20 animate-pulse bg-muted rounded" />
                    <div className="h-5 w-28 animate-pulse bg-muted rounded" />
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-border rounded-md p-6 space-y-4">
              <div className="h-5 w-40 animate-pulse bg-muted rounded" />
              <div className="h-3 w-56 animate-pulse bg-muted rounded" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 py-2">
                    <div className="size-5 animate-pulse bg-muted rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-44 animate-pulse bg-muted rounded" />
                      <div className="h-3 w-28 animate-pulse bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollableContent>
    );
  }

  if (!kyc) return null;

  return (
    <ScrollableContent>
      <div className="pt-6">
        <SettingsTabs />

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>KYC Verification Level</CardTitle>
              <CardDescription>
                Your current verification tier determines your transaction limits.
                Higher tiers unlock higher limits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <TierBadge tier={kyc.tier} />
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                {[
                  { label: "Daily limit", value: formatCurrency(kyc.limits.dailyTransactionLimit) },
                  { label: "Monthly limit", value: formatCurrency(kyc.limits.monthlyTransactionLimit) },
                  { label: "Per transaction", value: formatCurrency(kyc.limits.perTransactionLimit) },
                  { label: "Max balance", value: kyc.limits.maxBalance ? formatCurrency(kyc.limits.maxBalance) : "Unlimited" },
                ].map((item) => (
                  <div key={item.label} className="border border-border rounded-md p-3">
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className="text-sm font-medium mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription>
                Complete the requirements below to upgrade your tier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RequirementRow
                label="BVN (Bank Verification Number)"
                met={kyc.bvn.verified}
                value={kyc.bvn.value}
              />
              <RequirementRow
                label="Government-issued ID"
                met={kyc.id.verified}
                value={kyc.id.type ? `${kyc.id.type} — ${kyc.id.number}` : undefined}
              />
              <RequirementRow
                label="Proof of address"
                met={kyc.address.verified}
              />
            </CardContent>
          </Card>

          {kyc.nextTier && (
            <Card>
              <CardHeader>
                <CardTitle>Upgrade to {TIER_INFO[kyc.nextTier]?.name}</CardTitle>
                <CardDescription>
                  {kyc.nextTier === "tier_2"
                    ? "Submit your BVN to upgrade to Tier 2 and unlock higher limits."
                    : "Submit your ID and address proof to upgrade to Tier 3 (full KYC)."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {kyc.nextTier === "tier_2" && !kyc.bvn.verified && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="bvn">BVN (11 digits)</Label>
                      <Input
                        id="bvn"
                        type="text"
                        inputMode="numeric"
                        maxLength={11}
                        value={bvn}
                        onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
                        placeholder="Enter your 11-digit BVN"
                      />
                    </div>
                    <Button
                      onClick={() => submitBvn.mutate({ bvn })}
                      disabled={bvn.length !== 11 || submitBvn.isPending}
                    >
                      {submitBvn.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
                      Verify BVN
                    </Button>
                  </div>
                )}

                {(kyc.nextTier === "tier_3" || (kyc.tier === "tier_2" && !kyc.id.verified)) && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <h4 className="text-sm font-medium">Government-issued ID</h4>
                    <div className="space-y-1.5">
                      <Label htmlFor="idType">ID Type</Label>
                      <Select value={idType} onValueChange={setIdType}>
                        <SelectTrigger id="idType">
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="national_id">National ID</SelectItem>
                          <SelectItem value="passport">International Passport</SelectItem>
                          <SelectItem value="drivers_license">Driver&apos;s License</SelectItem>
                          <SelectItem value="voters_card">Voter&apos;s Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="idNumber">ID Number</Label>
                      <Input
                        id="idNumber"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        placeholder="Enter ID number"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="idFront">Front image URL</Label>
                      <Input
                        id="idFront"
                        value={idFrontUrl}
                        onChange={(e) => setIdFrontUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="idBack">Back image URL (optional)</Label>
                      <Input
                        id="idBack"
                        value={idBackUrl}
                        onChange={(e) => setIdBackUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <Button
                      onClick={() => submitId.mutate({ idType, idNumber, idFrontUrl, idBackUrl: idBackUrl || undefined })}
                      disabled={!idType || !idNumber || !idFrontUrl || submitId.isPending}
                    >
                      {submitId.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
                      Submit ID
                    </Button>
                  </div>
                )}

                {(kyc.nextTier === "tier_3" || (kyc.tier === "tier_2" && !kyc.address.verified)) && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <h4 className="text-sm font-medium">Proof of address</h4>
                    <div className="space-y-1.5">
                      <Label htmlFor="addressProof">Document URL</Label>
                      <Input
                        id="addressProof"
                        value={addressProofUrl}
                        onChange={(e) => setAddressProofUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <Button
                      onClick={() => submitAddress.mutate({ proofUrl: addressProofUrl })}
                      disabled={!addressProofUrl || submitAddress.isPending}
                    >
                      {submitAddress.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
                      Submit address proof
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ScrollableContent>
  );
}

function RequirementRow({ label, met, value }: { label: string; met: boolean; value?: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {met ? (
        <CheckCircle2 className="size-5 text-emerald-500 mt-0.5 shrink-0" />
      ) : (
        <Circle className="size-5 text-muted-foreground mt-0.5 shrink-0" />
      )}
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {value && <div className="text-xs text-muted-foreground mt-0.5 truncate">{value}</div>}
      </div>
    </div>
  );
}
