"use client";

import { Outlet, useNavigate, Link } from "react-router-dom";
import { useEffect, useLayoutEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { MainMenu } from "@/components/main-menu";
import { BusinessDropdown } from "@/components/business-dropdown";
import { cn } from "ui/cn";
import { TopBar } from "@/components/header";
import { AlertTriangle } from "lucide-react";

import { GlobalSheetsProvider } from "@/components/sheets/global-sheets-provider";
import { TimezoneDetector } from "@/components/timezone-detector";
import { hasAuthToken } from "@/utils/session";

const TOP_BAR_HEIGHT = 70;

function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 z-[60] hidden flex-col justify-between border-r border-border bg-background pb-4 transition-all duration-200 md:flex",
        "desktop:rounded-bl-[10px] desktop:overflow-hidden",
        isExpanded ? "w-[240px]" : "w-[70px]",
      )}
      style={{
        top: TOP_BAR_HEIGHT,
        height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="mb-3 flex w-full flex-1 flex-col border-b border-border">
        <MainMenu isExpanded={isExpanded} />
      </div>

      <BusinessDropdown isExpanded={isExpanded} />
    </aside>
  );
}

export function SidebarLayout() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useLayoutEffect(() => {
    void queryClient.ensureQueryData(trpc.user.me.queryOptions());
    void queryClient.ensureQueryData(trpc.business.list.queryOptions());
  }, [queryClient, trpc]);

  const { data: user, isPending, isFetching } = useQuery({
    ...trpc.user.me.queryOptions(),
    retry: false,
    refetchOnMount: "always",
  });

  useEffect(() => {
    const isDesktop =
      typeof navigator !== "undefined" &&
      navigator.userAgent?.includes("PayGrid Desktop App");
    if (isDesktop) {
      document.documentElement.classList.add("desktop");
    }
    return () => {
      if (isDesktop) {
        document.documentElement.classList.remove("desktop");
      }
    };
  }, []);

  useEffect(() => {
    if (isPending || isFetching) return;

    if (!user) {
      if (!hasAuthToken()) {
        navigate("/login", { replace: true });
      }
      return;
    }

    if (!user.fullName || !user.businessId) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, isPending, isFetching, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Sidebar />

      <div
        className="pb-4 md:ml-[70px]"
        style={{ paddingTop: TOP_BAR_HEIGHT }}
      >
        <KybNudge />
        <div className="px-4 md:px-8">
          <Outlet />
        </div>
      </div>

      <GlobalSheetsProvider />
      <TimezoneDetector />
    </div>
  );
}

function KybNudge() {
  const trpc = useTRPC();
  const { data: kyb } = useQuery({
    ...trpc.kyc.status.queryOptions(),
    enabled: hasAuthToken(),
  });

  if (!kyb) return null;
  if (kyb.status !== "none" || kyb.tier !== "tier_1") return null;

  return (
    <Link
      to="/settings/kyc"
      className="mx-4 md:mx-8 mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-colors"
    >
      <AlertTriangle className="size-4 shrink-0" />
      <span>
        Complete your business verification to unlock higher transaction limits.
      </span>
    </Link>
  );
}
