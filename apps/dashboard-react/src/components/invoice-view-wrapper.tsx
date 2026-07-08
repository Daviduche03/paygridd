"use client";

import { cn } from "ui/cn";
import { useMediaQuery } from "ui/hooks";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PaymentSuccessCelebration } from "./invoice/payment-success-celebration";
import CustomerHeader from "./customer-header";
import InvoiceToolbar from "./invoice-toolbar";
import { useTRPC } from "@/trpc/client";

type Props = {
  token: string;
  invoiceNumber: string;
  paymentEnabled?: boolean;
  paymentMethod?: "bank_transfer" | "stripe";
  virtualAccount?: {
    bankName: string | null;
    accountName: string | null;
    accountNumber: string | null;
  } | null;
  amount?: number;
  currency?: string;
  initialStatus?: string;
  customerName: string;
  customerWebsite?: string | null;
  customerPortalEnabled?: boolean;
  customerPortalId?: string | null;
  children: ReactNode;
  onPaymentOpenChange?: (open: boolean) => void;
  isPaymentOpen?: boolean;
  invoiceWidth?: number;
};

export function InvoiceViewWrapper({
  token,
  invoiceNumber,
  paymentEnabled,
  paymentMethod = "bank_transfer",
  virtualAccount,
  amount,
  currency,
  initialStatus,
  customerName,
  customerWebsite,
  customerPortalEnabled,
  customerPortalId,
  children,
  onPaymentOpenChange,
  isPaymentOpen,
  invoiceWidth = 595,
}: Props) {
  const trpc = useTRPC();
  const [status, setStatus] = useState(initialStatus);
  const [showPaymentCelebration, setShowPaymentCelebration] = useState(false);
  const [internalPaymentOpen, setInternalPaymentOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const paidOnInitialMount = useRef(initialStatus === "paid");
  const celebrationShown = useRef(false);
  const numericAmount =
    typeof amount === "number" ? amount : Number(amount ?? 0) || 0;

  const canPollPayment =
    paymentEnabled &&
    status !== "paid" &&
    status !== "canceled" &&
    status !== "refunded" &&
    numericAmount > 0;

  const { data: liveInvoice } = useQuery({
    ...trpc.invoice.getInvoiceByToken.queryOptions({ token }),
    enabled: canPollPayment,
    refetchInterval: canPollPayment ? 5000 : false,
  });

  const triggerCelebration = useCallback(() => {
    if (paidOnInitialMount.current || celebrationShown.current) return;
    celebrationShown.current = true;
    setShowPaymentCelebration(true);
  }, []);

  const markPaymentSuccessful = useCallback(() => {
    setStatus("paid");
    triggerCelebration();
  }, [triggerCelebration]);

  useEffect(() => {
    setStatus(initialStatus);
    if (initialStatus === "paid") {
      triggerCelebration();
    }
  }, [initialStatus, triggerCelebration]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const paymentOpen = isPaymentOpen ?? internalPaymentOpen;
  const handlePaymentOpenChange = onPaymentOpenChange ?? setInternalPaymentOpen;

  const sheetWidth = 520;
  const minWidthNeeded = invoiceWidth + sheetWidth + 40;
  const useOverlay = windowWidth > 0 && windowWidth < minWidthNeeded;

  useEffect(() => {
    if (liveInvoice?.status === "paid" && status !== "paid") {
      markPaymentSuccessful();
    }
  }, [liveInvoice?.status, markPaymentSuccessful, status]);

  return (
    <>
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isDesktop && paymentOpen && !useOverlay && "md:mr-[520px]",
        )}
      >
        <div className="flex flex-col justify-center items-center min-h-screen dotted-bg p-4 sm:p-6 md:p-0">
          <div
            className="flex flex-col w-full max-w-full py-6"
            style={{ maxWidth: invoiceWidth }}
          >
            <CustomerHeader
              name={customerName}
              website={customerWebsite}
              status={
                status as
                  | "overdue"
                  | "paid"
                  | "unpaid"
                  | "draft"
                  | "canceled"
                  | "scheduled"
                  | "refunded"
              }
              portalEnabled={customerPortalEnabled}
              portalId={customerPortalId}
            />
            {children}
          </div>
        </div>
      </div>

      <InvoiceToolbar
        token={token}
        invoiceNumber={invoiceNumber}
        paymentEnabled={paymentEnabled}
        paymentMethod={paymentMethod}
        virtualAccount={virtualAccount}
        amount={amount}
        currency={currency}
        status={status}
        onPaymentSuccess={markPaymentSuccessful}
        portalEnabled={customerPortalEnabled}
        portalId={customerPortalId}
        onPaymentOpenChange={handlePaymentOpenChange}
        isPaymentOpen={paymentOpen}
        useOverlay={useOverlay}
      />

      {numericAmount > 0 && (
        <PaymentSuccessCelebration
          open={showPaymentCelebration}
          onClose={() => setShowPaymentCelebration(false)}
          amount={numericAmount}
          currency={currency ?? "NGN"}
          invoiceNumber={invoiceNumber}
          invoiceToken={token}
          customerName={customerName}
        />
      )}
    </>
  );
}