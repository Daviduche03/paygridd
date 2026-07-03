"use client";

import { cn } from "ui/cn";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { path: "/settings", label: "General" },
  { path: "/settings/members", label: "Members" },
  { path: "/settings/kyc", label: "KYC" },
  { path: "/settings/developer", label: "Developer" },
];

export function SettingsTabs() {
  const { pathname } = useLocation();

  return (
    <div className="flex items-center gap-1 border-b border-border mb-8">
      {tabs.map((tab) => {
        const isActive =
          tab.path === "/settings"
            ? pathname === "/settings"
            : pathname.startsWith(tab.path);

        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
