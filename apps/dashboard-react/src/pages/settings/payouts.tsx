"use client";

import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { useToast } from "ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ScrollableContent } from "@/components/scrollable-content";
import { SettingsTabs } from "@/components/settings-tabs";
import { useTRPC } from "@/trpc/client";

function formatCurrency(n: number): string {
  return `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PayoutsSettingsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");

  const { data: balance, isLoading: balanceLoading } = useQuery(
    trpc.payouts.balance.queryOptions(),
  );

  const { data: user } = useQuery(trpc.user.me.queryOptions());
  const businessId = user?.businessId;
  const { data: business } = useQuery({
    ...trpc.business.get.queryOptions({ id: businessId! }),
    enabled: !!businessId,
  });

  const hasSettlement = !!business?.settlementAccountNumber;

  const transferMutation = useMutation(
    trpc.payouts.transfer.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.payouts.balance.queryKey() });
        toast({ duration: 3500, title: "Transfer initiated", variant: "success" });
        setAmount("");
      },
      onError: (err: Error) => {
        toast({ duration: 5000, title: err.message, variant: "error" });
      },
    }),
  );

  const handleTransfer = () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Enter a valid amount", variant: "error" });
      return;
    }
    if (balance && numAmount > balance.available) {
      toast({ title: `Insufficient balance. Available: ${formatCurrency(balance.available)}`, variant: "error" });
      return;
    }

    transferMutation.mutate({
      amount: numAmount,
      accountNumber: business!.settlementAccountNumber!,
      bankCode: business!.settlementBankCode!,
      accountName: business!.settlementAccountName ?? undefined,
      narration: "Payout from PayGridd",
    });
  };

  return (
    <ScrollableContent>
      <div className="pt-6">
        <SettingsTabs />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout Balance</CardTitle>
              <CardDescription>
                Available funds after platform fees (net of charges on incoming payments)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <div className="space-y-2">
                  <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
                  <div className="h-4 w-64 bg-muted animate-pulse rounded-md" />
                </div>
              ) : balance ? (
                <div className="space-y-1">
                  <p className="text-3xl font-bold">{formatCurrency(balance.available)}</p>
                  <p className="text-sm text-muted-foreground">
                    Net collected: {formatCurrency(balance.totalCollected)} &middot; Total paid out: {formatCurrency(balance.totalPaidOut)}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {hasSettlement ? (
            <Card>
              <CardHeader>
                <CardTitle>Withdraw Funds</CardTitle>
                <CardDescription>
                  Transfer to {business!.settlementBankName} &mdash; {business!.settlementAccountName} ({business!.settlementAccountNumber})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (NGN)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="max-w-[250px]"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleTransfer}
                  disabled={transferMutation.isPending}
                >
                  {transferMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Withdraw"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p className="mb-2">No settlement bank account configured.</p>
                <p className="text-sm">
                  Connect your bank account in{" "}
                  <Link to="/settings/kyc" className="underline text-foreground hover:text-primary">
                    KYC settings
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ScrollableContent>
  );
}