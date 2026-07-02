"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingPage } from "@/components/onboarding/onboarding-page";
import { useTRPC } from "@/trpc/client";

export default function OnboardingPageWrapper() {
  const navigate = useNavigate();
  const trpc = useTRPC();

  const { data: user, isLoading } = useQuery({
    ...trpc.user.me.queryOptions(),
    refetchOnMount: "always",
  });
  const { data: businesses } = useQuery(trpc.business.list.queryOptions());

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) {
    return null;
  }

  const hasOtherBusinesses = (businesses?.length ?? 0) > 1;

  return (
    <OnboardingPage
      defaultCurrencyPromise={Promise.resolve("NGN")}
      defaultCountryCodePromise={Promise.resolve("NG")}
      hasOtherBusinesses={hasOtherBusinesses}
      user={{
        id: user.id,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl ?? null,
        businessId: user.businessId,
      }}
    />
  );
}
