"use client";

import { Button } from "ui/button";
import { Icons } from "ui/icons";
import { Spinner } from "ui/spinner";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useConfetti } from "@/hooks/use-confetti";
import { useSuccessSound } from "@/hooks/use-success-sound";
import { downloadFile } from "@/lib/download";

type Props = {
  open: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  invoiceNumber: string;
  invoiceToken: string;
  customerName?: string;
};

function formatPaymentAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function PaymentSuccessCelebration({
  open,
  onClose,
  amount,
  currency,
  invoiceNumber,
  invoiceToken,
  customerName,
}: Props) {
  const { fire: fireConfetti, stop: stopConfetti } = useConfetti();
  const { play: playSuccessSound } = useSuccessSound();
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!open) return;

    playSuccessSound();
    fireConfetti();

    return () => {
      stopConfetti();
    };
  }, [open, fireConfetti, playSuccessSound, stopConfetti]);

  const handleDownloadReceipt = async () => {
    setIsDownloading(true);
    try {
      await downloadFile(
        `${process.env.NEXT_PUBLIC_API_URL}/files/download/invoice?token=${invoiceToken}&type=receipt`,
        `receipt-${invoiceNumber}.pdf`,
      );
      await new Promise((resolve) => setTimeout(resolve, 600));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md border border-border bg-background shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-success-title"
          >
            <div className="px-6 pt-10 pb-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 18,
                  delay: 0.1,
                }}
                className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-[#DDF1E4] dark:bg-[#00C969]/15"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 16,
                    delay: 0.25,
                  }}
                >
                  <Check className="size-10 text-[#00C969]" strokeWidth={2.5} />
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
              >
                <h2
                  id="payment-success-title"
                  className="font-serif text-2xl sm:text-3xl mb-2"
                >
                  Payment successful
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {customerName
                    ? `Thanks, ${customerName}. Your payment has been received.`
                    : "Your payment has been received. Thank you."}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.3 }}
                className="border border-border bg-[#F6F6F3] dark:bg-[#1A1A1A] p-5 mb-6"
              >
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                  Amount paid
                </p>
                <p className="text-3xl font-medium tabular-nums">
                  {formatPaymentAmount(amount, currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  Invoice {invoiceNumber}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.3 }}
                className="flex flex-col gap-2 sm:flex-row"
              >
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownloadReceipt}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Spinner className="size-4 mr-2" />
                      Downloading…
                    </>
                  ) : (
                    <>
                      <Icons.ArrowCoolDown className="size-4 mr-2" />
                      Download receipt
                    </>
                  )}
                </Button>
                <Button className="flex-1" onClick={onClose}>
                  Done
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}