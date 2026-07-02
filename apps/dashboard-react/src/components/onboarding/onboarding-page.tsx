"use client";


import { LogEvents } from "eventbus/events";
import { BulkReconciliationAnimation } from "ui/animations/bulk-reconciliation";
import { SubmitButton } from "ui/submit-button";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryStates } from "nuqs";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppDetailSheet } from "@/components/sheets/app-detail-sheet";
import { useOnboardingStep } from "@/hooks/use-onboarding-step";
import { useOnboardingTracking } from "@/hooks/use-onboarding-tracking";
import { useTRPC } from "@/trpc/client";
import {
  type InboxSyncState,
  OnboardingSyncStatus,
} from "./onboarding-sync-status";
import { OnboardingUserMenu } from "./onboarding-user-menu";
import { ConnectBankNigeriaStep } from "./steps/connect-bank-nigeria-step";
import { CreateBusinessStep } from "./steps/create-business-step";
import { ReconciliationStep } from "./steps/reconciliation-step";
import { SetNameStep } from "./steps/set-name-step";

type StepConfig = {
  key: string;
  animation: ReactNode;
  content: ReactNode;
  overlay?: boolean;
  navigation: "none" | "submit" | "skip" | "next";
  canGoBack?: boolean;
  trackEvent?: { name: string; channel: string };
};

function DashboardImageAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-center overflow-visible"
      style={{ width: "100%", height: "100%", transformOrigin: "center" }}
    >
      <Image
        src="https://cdn.paygrid.xyz/web/dashboard-light.svg"
        alt="Dashboard illustration"
        width={2400}
        height={1800}
        className="h-auto transform -rotate-[2deg] dark:hidden"
        style={{ width: "140%", minWidth: "1400px" }}
        priority
      />
      <Image
        src="https://cdn.paygrid.xyz/web/dashboard-dark.svg"
        alt="Dashboard illustration"
        width={2400}
        height={1800}
        className="h-auto transform -rotate-[2deg] hidden dark:block"
        style={{ width: "140%", minWidth: "1400px" }}
        priority
      />
    </motion.div>
  );
}

function OnboardingImageAnimation({ src }: { src: string }) {
  return (
    <motion.img
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      src={src}
      alt=""
      className="w-full h-full object-cover"
    />
  );
}

function GradientOverlay() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none z-[15] dark:hidden"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, transparent 50%, rgba(255, 255, 255, 0.2) 70%, rgba(255, 255, 255, 0.5) 85%, rgba(255, 255, 255, 0.8) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-[15] hidden dark:block"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, transparent 50%, rgba(8, 8, 8, 0.2) 70%, rgba(8, 8, 8, 0.5) 85%, rgba(8, 8, 8, 0.8) 100%)",
        }}
      />
    </>
  );
}

type Props = {
  defaultCurrencyPromise: Promise<string>;
  defaultCountryCodePromise: Promise<string>;
  hasOtherBusinesses: boolean;
  user: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    businessId: string | null;
  };
};

function ProgressBar({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  if (currentStep >= totalSteps) return null;

  return (
    <div className="flex justify-center">
      <motion.div
        layoutId="progress-bar-container"
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-32 h-1 bg-border overflow-hidden"
      >
        <motion.div
          layoutId="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{
            width: `${(currentStep / totalSteps) * 100}%`,
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full bg-primary"
        />
      </motion.div>
    </div>
  );
}

const NAV_LABELS: Record<StepConfig["navigation"], string | null> = {
  none: null,
  submit: null,
  skip: "Skip",
  next: "Next",
};

export function OnboardingPage({
  defaultCurrencyPromise,
  defaultCountryCodePromise,
  hasOtherBusinesses,
  user,
}: Props) {
  const router = useRouter();
  const [hasBusiness, setHasBusiness] = useState(!!user.businessId);
  const [hasFullName, setHasFullName] = useState(!!user.fullName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inboxSync, setInboxSync] = useState<InboxSyncState>(null);
  const [syncVisible, setSyncVisible] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [connectionParams, setConnectionParams] = useQueryStates({
    connected: parseAsString,
    provider: parseAsString,
    countryCode: parseAsString,
  });

  const { step, stepKey, nextStep, prevStep, totalSteps } = useOnboardingStep({
    hasBusiness,
    hasFullName,
  });

  const { trackNavigation, trackEvent } = useOnboardingTracking(step);

  useEffect(() => {
    if (
      connectionParams.connected === "true" &&
      connectionParams.provider &&
      !inboxSync
    ) {
      setInboxSync({ provider: connectionParams.provider });
      trackEvent(LogEvents.OnboardingInboxConnected, {
        provider: connectionParams.provider,
      });
      setConnectionParams({ connected: null, provider: null });
    }
  }, [connectionParams, inboxSync, setConnectionParams, trackEvent]);

  const handleBusinessCreated = useCallback(() => {
    setHasBusiness(true);
    nextStep();
  }, [nextStep]);

  const handleNameSet = useCallback(() => {
    setHasFullName(true);
    nextStep();
  }, [nextStep]);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsSubmitting(loading);
  }, []);



  const steps: StepConfig[] = useMemo(
    () => [
      // Step 1 — Profile (name + avatar). Skipped via minStep when hasFullName.
      {
        key: "set-name",
        animation: <DashboardImageAnimation />,
        content: (
          <SetNameStep
            userId={user.id}
            avatarUrl={user.avatarUrl}
            onComplete={handleNameSet}
            onLoadingChange={handleLoadingChange}
          />
        ),
        overlay: true,
        navigation: "submit" as const,
      },
      // Step 2 — Business details / create business. Skipped via minStep when hasBusiness.
      {
        key: "create-business",
        animation: <OnboardingImageAnimation src="/images/onboarding-2.jpg" />,
        content: (
          <CreateBusinessStep
            defaultCurrencyPromise={defaultCurrencyPromise}
            defaultCountryCodePromise={defaultCountryCodePromise}
            onComplete={handleBusinessCreated}
            onLoadingChange={handleLoadingChange}
          />
        ),
        overlay: true,
        navigation: "submit" as const,
      },
      // Step 3 — Connect bank (Nigeria)
      {
        key: "connect-bank",
        animation: <OnboardingImageAnimation src="/images/onboarding-3.jpg" />,
        content: (
          <ConnectBankNigeriaStep
            onComplete={nextStep}
            onLoadingChange={handleLoadingChange}
          />
        ),
        overlay: true,
        navigation: "skip" as const,
        canGoBack: true,
        trackEvent: LogEvents.OnboardingStepCompleted,
      },
      {
        key: "reconciliation",
        animation: <BulkReconciliationAnimation />,
        content: <ReconciliationStep />,
        navigation: "next",
        canGoBack: true,
        trackEvent: LogEvents.OnboardingStepCompleted,
      },
    ],
    [
      user.id,
      user.avatarUrl,
      defaultCurrencyPromise,
      defaultCountryCodePromise,
      handleBusinessCreated,
      handleNameSet,
      handleLoadingChange,
      nextStep,
    ],
  );

  const currentStep = steps[step - 1];
  const isLastStep = step >= totalSteps;

  // Prefetch the dashboard route as soon as the user reaches the final step
  useEffect(() => {
    if (isLastStep) {
      router.prefetch("/");
    }
  }, [isLastStep, router]);

  if (!currentStep) return null;

  const navLabel = NAV_LABELS[currentStep.navigation];

  const handleNavigation = () => {
    trackNavigation(currentStep);
    if (isLastStep) {
      router.push("/");
      return;
    }
    nextStep();
  };

  return (
    <div className="h-screen overflow-hidden flex relative">
      <AppDetailSheet />
      <nav className="fixed top-0 left-0 right-0 z-50 w-full pointer-events-none">
        <div className="relative py-3 xl:py-4 px-4 sm:px-4 md:px-4 lg:px-4 xl:px-6 2xl:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="PayGrid" className="h-10 w-auto" />
            {hasOtherBusinesses && (
              <Link
                href="/businesses"
                className="pointer-events-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Select business
              </Link>
            )}
          </div>
          <div className="pointer-events-auto">
            <OnboardingUserMenu />
          </div>
        </div>
      </nav>

      {/* Left Side - Animation */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#f7f7f7] dark:bg-[#080808]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full h-full"
          >
            {currentStep.animation}
          </motion.div>
        </AnimatePresence>

        {currentStep.overlay && <GradientOverlay />}
      </div>

      {/* Right Side - Onboarding content */}
      <div className="w-full lg:w-1/2 flex flex-col items-center p-8 lg:p-12 pt-10 dark:bg-[#0c0c0c] text-foreground">
        <div className="w-full max-w-md flex flex-col h-full relative">
          <div className="relative h-6 mb-2">
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <OnboardingSyncStatus
                bankSync={null}
                inboxSync={inboxSync}
                onVisibilityChange={setSyncVisible}
              />
            </div>
            {!syncVisible && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ProgressBar currentStep={step} totalSteps={totalSteps} />
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center pt-20 min-h-0 overflow-y-auto scrollbar-hide">
            <motion.div
              layout
              transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={stepKey}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    opacity: { duration: 0.2 },
                    layout: { duration: 0.3, ease: "easeInOut" },
                  }}
                >
                  {currentStep.content}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Navigation Buttons - Bottom */}
          {currentStep.navigation !== "none" && (
            <div className="mt-auto pt-8">
              {currentStep.navigation === "submit" ? (
                <div className="flex justify-end">
                  <SubmitButton
                    type="submit"
                    form={`${currentStep.key}-form`}
                    isSubmitting={isSubmitting}
                    className="px-4 py-2 bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                  >
                    Continue
                  </SubmitButton>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    {currentStep.canGoBack && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-4 py-2 bg-secondary border border-border text-foreground text-sm hover:bg-accent transition-colors"
                      >
                        Previous
                      </button>
                    )}
                  </div>

                  <div>
                    {navLabel && (
                      <button
                        type="button"
                        onClick={handleNavigation}
                        className="px-4 py-2 bg-secondary border border-border text-foreground text-sm hover:bg-accent transition-colors"
                      >
                        {currentStep.key === "connect-bank"
                          ? "Skip for now"
                          : isLastStep
                            ? "Finish"
                            : navLabel}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
