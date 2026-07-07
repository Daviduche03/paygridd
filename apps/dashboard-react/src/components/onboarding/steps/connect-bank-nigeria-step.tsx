"use client";

import { Button } from "ui/button";
import { ComboboxDropdown } from "ui/combobox-dropdown";
import { Input } from "ui/input";
import { Spinner } from "ui/spinner";
import { useToast } from "ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";

type Bank = {
  code: string;
  name: string;
};

type Props = {
  onComplete: () => void;
  onLoadingChange?: (loading: boolean) => void;
};

export function ConnectBankNigeriaStep({ onComplete }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [verifiedName, setVerifiedName] = useState<string | null>(null);

  const { data: banksData, isLoading: banksLoading } = useQuery({
    ...trpc.banks.list.queryOptions(),
  });

  const { data: user } = useQuery(trpc.user.me.queryOptions());

  const banks: Bank[] = banksData ?? [];

  const bankItems = banks.map((bank) => ({
    id: bank.code,
    label: bank.name,
  }));

  const selectedBank = bankItems.find((item) => item.id === selectedBankCode);
  const selectedBankName = selectedBank?.label ?? "";

  const verifyMutation = useMutation({
    ...trpc.banks.verify.mutationOptions({
      onSuccess: (data: any) => {
        setVerifiedName(data?.accountName ?? "Verified");
      },
      onError: (error: any) => {
        toast({
          duration: 6000,
          title: "Verification failed",
          variant: "info",
          description: error.message ?? "Could not verify account number. Please check and try again.",
        });
      },
    }),
  });

  const saveSettlementMutation = useMutation({
    ...trpc.business.updateSettlementAccount.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
        onComplete();
      },
      onError: (error: any) => {
        toast({
          duration: 6000,
          title: "Failed to save bank account",
          variant: "info",
          description: error.message ?? "Please try again.",
        });
      },
    }),
  });

  const handleVerify = () => {
    if (!selectedBankCode || accountNumber.length !== 10) return;
    setVerifiedName(null);
    verifyMutation.mutate({ accountNumber, bankCode: selectedBankCode });
  };

  const handleConfirm = () => {
    if (!user?.businessId) {
      queryClient.invalidateQueries();
      onComplete();
      return;
    }
    saveSettlementMutation.mutate({
      settlementBankName: selectedBankName,
      settlementBankCode: selectedBankCode,
      settlementAccountNumber: accountNumber,
      settlementAccountName: verifiedName ?? "",
    });
  };

  const isSaving = saveSettlementMutation.isPending;

  return (
    <div className="space-y-4">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-lg lg:text-xl font-serif"
      >
        Connect your bank account
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-sm text-muted-foreground leading-relaxed"
      >
        Verify your Nigerian bank account to receive payouts from collected payments.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <label className="text-xs text-primary font-normal block">
            Select your bank
          </label>
          {banksLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner /> Loading banks...
            </div>
          ) : (
            <ComboboxDropdown
              placeholder="Select a bank"
              searchPlaceholder="Search banks..."
              items={bankItems}
              selectedItem={selectedBank}
              onSelect={(item) => {
                setSelectedBankCode(item.id);
                setVerifiedName(null);
              }}
              triggerClassName="bg-secondary border-border text-foreground w-full"
            />
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-primary font-normal block">
            Account number
          </label>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={10}
            value={accountNumber}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              setAccountNumber(digits);
              setVerifiedName(null);
            }}
            placeholder="0123456789"
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {!verifiedName && (
          <Button
            type="button"
            onClick={handleVerify}
            disabled={
              !selectedBankCode ||
              accountNumber.length !== 10 ||
              verifyMutation.isPending
            }
            className="w-full"
          >
            {verifyMutation.isPending && <Spinner />}
            {verifyMutation.isPending ? "Verifying..." : "Verify account"}
          </Button>
        )}

        {verifiedName && (
          <div className="border border-border rounded-md p-4 space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Account name: </span>
              <span className="font-medium">{verifiedName}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Account number: </span>
              <span className="font-medium">{accountNumber}</span>
            </div>
            <Button type="button" onClick={handleConfirm} disabled={isSaving} className="w-full">
              {isSaving ? "Saving..." : "Confirm & continue"}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
