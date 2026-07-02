"use client";

import { Button } from "ui/button";
import { cn } from "ui/cn";
import { Drawer, DrawerContent } from "ui/drawer";
import { useMediaQuery } from "ui/hooks";
import { Spinner } from "ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { type RefObject, useEffect, useRef, useState } from "react";
import { MdContentCopy } from "react-icons/md";
import { useOnClickOutside } from "usehooks-ts";
import { useCopyToClipboard } from "usehooks-ts";
import { useSuccessSound } from "@/hooks/use-success-sound";
import { useTRPC } from "@/trpc/client";

type VirtualAccount = {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceToken: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  virtualAccount: VirtualAccount;
  onSuccess?: () => void;
  useOverlay?: boolean;
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [, copy] = useCopyToClipboard();

  return (
    <div className="flex items-start justify-between gap-3 border border-border p-3">
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-all">{value}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 size-8"
        onClick={() => copy(value)}
      >
        <MdContentCopy className="size-4" />
      </Button>
    </div>
  );
}

export function BankTransferPaymentModal({
  open,
  onOpenChange,
  invoiceToken,
  invoiceNumber,
  amount,
  currency,
  virtualAccount,
  onSuccess,
  useOverlay = false,
}: Props) {
  const trpc = useTRPC();
  const { play: playSuccessSound } = useSuccessSound();
  const [paid, setPaid] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: invoice } = useQuery({
    ...trpc.invoice.getInvoiceByToken.queryOptions({ token: invoiceToken }),
    enabled: open && !paid,
    refetchInterval: open && !paid ? 5000 : false,
  });

  useEffect(() => {
    if (invoice?.status === "paid") {
      playSuccessSound();
      setPaid(true);
      onSuccess?.();
    }
  }, [invoice?.status, onSuccess, playSuccessSound]);

  useOnClickOutside(panelRef as RefObject<HTMLElement>, (event) => {
    if (isDesktop && open && !useOverlay) {
      const target = event.target as Element;
      const toolbar = document.querySelector("[data-invoice-toolbar]");
      if (toolbar?.contains(target)) return;
      onOpenChange(false);
    }
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPaid(false);
    }
    onOpenChange(next);
  };

  const Content = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn("flex flex-col", isMobile ? "h-full" : "flex-1 min-h-0")}>
      {paid ? (
        <div
          className={cn(
            "flex flex-col items-center justify-center text-center",
            isMobile ? "h-full py-8 px-4" : "flex-1 min-h-0 py-8",
          )}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-serif mb-2">Payment received</h2>
            <p className="text-muted-foreground mb-6">
              Your transfer has been confirmed. Thank you.
            </p>
            <div className="border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Amount paid</p>
              <p className="text-xl">{formatMoney(amount, currency)}</p>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
            <div>
              <h2 className="text-lg font-medium">Pay by bank transfer</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Transfer the exact amount to the account below. Payment is confirmed automatically.
              </p>
            </div>

            <div className="border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Amount due</p>
              <p className="text-2xl">{formatMoney(amount, currency)}</p>
            </div>

            <div className="space-y-2">
              {virtualAccount.bankName && (
                <CopyRow label="Bank" value={virtualAccount.bankName} />
              )}
              {virtualAccount.accountName && (
                <CopyRow label="Account name" value={virtualAccount.accountName} />
              )}
              {virtualAccount.accountNumber && (
                <CopyRow label="Account number" value={virtualAccount.accountNumber} />
              )}
              <CopyRow label="Reference" value={invoiceNumber} />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Waiting for your transfer…
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (!isDesktop) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="flex flex-col max-h-[90vh]">
          <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
            <Content isMobile />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  if (useOverlay) {
    return (
      <>
        {open && (
          <div
            className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
            onClick={() => handleOpenChange(false)}
          />
        )}
        <div
          ref={panelRef}
          data-payment-panel
          className={cn(
            "fixed z-40 scrollbar-hide overflow-y-auto",
            "bg-background border border-border overflow-x-hidden transition-all duration-300 ease-in-out",
            "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-[90vw] max-h-[90vh]",
            open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
            !isDesktop && "hidden",
          )}
        >
          <div className="h-full flex flex-col relative p-6">
            <Content />
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      ref={panelRef}
      data-payment-panel
      className={cn(
        "fixed z-30 scrollbar-hide overflow-y-auto",
        "bg-background border border-border overflow-x-hidden transition-transform duration-300 ease-in-out",
        "top-0 bottom-0 right-0 w-[520px]",
        open ? "translate-x-0" : "translate-x-full",
        !isDesktop && "hidden",
      )}
      style={{ height: "100vh" }}
    >
      <div className="h-full flex flex-col relative p-6">
        <Content />
      </div>
    </div>
  );
}
