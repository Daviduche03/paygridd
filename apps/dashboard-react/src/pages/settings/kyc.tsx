"use client";

import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { useToast } from "ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, XCircle, Lock, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { ScrollableContent } from "@/components/scrollable-content";
import { SettingsTabs } from "@/components/settings-tabs";
import { ConnectBankNigeriaStep } from "@/components/onboarding/steps/connect-bank-nigeria-step";
import { useTRPC } from "@/trpc/client";

const TIER_INFO: Record<string, { name: string; color: string; description: string }> = {
  tier_1: { name: "Tier 1", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300", description: "Basic" },
  tier_2: { name: "Tier 2", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", description: "Registered Business" },
  tier_3: { name: "Tier 3", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", description: "Full KYB" },
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

function StatusBadge({ status }: { status: string }) {
  if (status === "pending_review") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        <Clock className="size-3" />
        Pending Review
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
        <XCircle className="size-3" />
        Rejected
      </span>
    );
  }
  return null;
}

function formatCurrency(n: number): string {
  return `₦${n.toLocaleString()}`;
}

export default function KycSettingsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: kyb, isLoading } = useQuery(trpc.kyc.status.queryOptions());

  // Tier 2 form
  const [rcNumber, setRcNumber] = useState("");
  const [cacDocumentUrl, setCacDocumentUrl] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [directorPhone, setDirectorPhone] = useState("");
  const [addressProofUrl, setAddressProofUrl] = useState("");

  // Tier 3 form
  const [directorBvn, setDirectorBvn] = useState("");
  const [memorandumUrl, setMemorandumUrl] = useState("");

  const submitTier2 = useMutation({
    ...trpc.kyc.submitTier2.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.kyc.status.queryKey() });
        toast({ title: "Documents submitted", description: "Your Tier 2 application is pending review" });
      },
      onError: (error: any) => {
        toast({ title: "Submission failed", description: error.message, variant: "info" });
      },
    }),
  });

  const submitTier3 = useMutation({
    ...trpc.kyc.submitTier3.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.kyc.status.queryKey() });
        toast({ title: "Documents submitted", description: "Your Tier 3 application is pending review" });
      },
      onError: (error: any) => {
        toast({ title: "Submission failed", description: error.message, variant: "info" });
      },
    }),
  });

  const handleBankComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: trpc.business.get.queryKey() });
    queryClient.invalidateQueries({ queryKey: trpc.business.list.queryKey() });
    toast({ duration: 2500, title: "Bank account connected", variant: "success" });
  }, [queryClient, trpc]);

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

  if (!kyb) return null;

  const needsTier2 = kyb.tier === "tier_1" && kyb.nextTier === "tier_2";
  const needsTier3 = kyb.tier === "tier_2" && kyb.nextTier === "tier_3";
  const isPending = kyb.status === "pending_review";
  const isRejected = kyb.status === "rejected";

  return (
    <ScrollableContent>
      <div className="pt-6">
        <SettingsTabs />

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>KYB Verification Level</CardTitle>
              <CardDescription>
                Your Know Your Business (KYB) tier determines your transaction limits.
                Higher tiers unlock higher limits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <TierBadge tier={kyb.tier} />
                {isPending && <StatusBadge status="pending_review" />}
                {isRejected && <StatusBadge status="rejected" />}
              </div>

              {isRejected && kyb.rejectionReason && (
                <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 px-4 py-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Rejection reason</p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{kyb.rejectionReason}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-4">
                {[
                  { label: "Daily limit", value: formatCurrency(kyb.limits.dailyTransactionLimit) },
                  { label: "Monthly limit", value: formatCurrency(kyb.limits.monthlyTransactionLimit) },
                  { label: "Per transaction", value: formatCurrency(kyb.limits.perTransactionLimit) },
                  { label: "Max balance", value: kyb.limits.maxBalance ? formatCurrency(kyb.limits.maxBalance) : "Unlimited" },
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
                Requirements to upgrade your business tier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RequirementRow
                label="RC Number (CAC registration)"
                met={kyb.tier2.submitted}
                value={kyb.tier2.data?.rcNumber}
              />
              <RequirementRow
                label="Business director details"
                met={kyb.tier2.submitted}
                value={kyb.tier2.data?.directorName ? `${kyb.tier2.data.directorName} — ${kyb.tier2.data.directorPhone}` : undefined}
              />
              <RequirementRow
                label="Proof of business address"
                met={kyb.tier2.submitted}
              />
              <RequirementRow
                label="Director BVN (Tier 3)"
                met={kyb.tier3.submitted}
                value={kyb.tier3.data?.directorBvn}
              />
              <RequirementRow
                label="Memorandum & Articles of Association (Tier 3)"
                met={kyb.tier3.submitted}
              />
            </CardContent>
          </Card>

          {needsTier2 && (kyb.status === "none" || isRejected) && (
            <Card>
              <CardHeader>
                <CardTitle>Upgrade to Tier 2 — Registered Business</CardTitle>
                <CardDescription>
                  Submit your business registration details for manual review.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rcNumber">RC Number</Label>
                  <Input
                    id="rcNumber"
                    value={rcNumber}
                    onChange={(e) => setRcNumber(e.target.value)}
                    placeholder="RC 1234567"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cacDocumentUrl">CAC Certificate URL</Label>
                  <Input
                    id="cacDocumentUrl"
                    value={cacDocumentUrl}
                    onChange={(e) => setCacDocumentUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="directorName">Director Name</Label>
                  <Input
                    id="directorName"
                    value={directorName}
                    onChange={(e) => setDirectorName(e.target.value)}
                    placeholder="Full name of business director"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="directorPhone">Director Phone</Label>
                  <Input
                    id="directorPhone"
                    value={directorPhone}
                    onChange={(e) => setDirectorPhone(e.target.value)}
                    placeholder="080..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="addressProof">Proof of Business Address URL</Label>
                  <Input
                    id="addressProof"
                    value={addressProofUrl}
                    onChange={(e) => setAddressProofUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => submitTier2.mutate({ rcNumber, cacDocumentUrl, directorName, directorPhone, businessAddressProofUrl: addressProofUrl })}
                  disabled={!rcNumber || !cacDocumentUrl || !directorName || !directorPhone || !addressProofUrl || submitTier2.isPending}
                >
                  {submitTier2.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
                  Submit for Review
                </Button>
              </CardFooter>
            </Card>
          )}

          {isPending && (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="size-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Application Pending Review</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your documents are being reviewed. You'll be notified when the review is complete.
                </p>
              </CardContent>
            </Card>
          )}

          {needsTier3 && (kyb.status === "none" || isRejected) && (
            <Card>
              <CardHeader>
                <CardTitle>Upgrade to Tier 3 — Full KYB</CardTitle>
                <CardDescription>
                  Submit director BVN and Memorandum & Articles of Association.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="directorBvn">Director BVN (11 digits)</Label>
                  <Input
                    id="directorBvn"
                    type="text"
                    inputMode="numeric"
                    maxLength={11}
                    value={directorBvn}
                    onChange={(e) => setDirectorBvn(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 11-digit BVN"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="memorandumUrl">MEMART URL</Label>
                  <Input
                    id="memorandumUrl"
                    value={memorandumUrl}
                    onChange={(e) => setMemorandumUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => submitTier3.mutate({ directorBvn, memorandumUrl })}
                  disabled={directorBvn.length !== 11 || !memorandumUrl || submitTier3.isPending}
                >
                  {submitTier3.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
                  Submit for Review
                </Button>
              </CardFooter>
            </Card>
          )}

          <Card>
            <CardContent>
              <ConnectBankNigeriaStep onComplete={handleBankComplete} />
            </CardContent>
          </Card>
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
        <div className="size-5 rounded-full border-2 border-muted-foreground mt-0.5 shrink-0" />
      )}
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {value && <div className="text-xs text-muted-foreground mt-0.5 truncate">{value}</div>}
      </div>
    </div>
  );
}
