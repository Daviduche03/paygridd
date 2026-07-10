"use client";

import { cn } from "ui/cn";
import { Icons } from "ui/icons";
import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  GitCompareArrows,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

const icons = {
  "/overview": () => <Icons.Overview size={20} />,
  "/customers": () => <Icons.Customers size={20} />,
  "/virtual-accounts": () => <Building2 size={20} />,
  "/transactions": () => <Icons.Transactions size={20} />,
  "/invoices": () => <Icons.ReceiptLong size={20} />,
  "/reconciliation": () => <GitCompareArrows size={20} />,
  // "/automation": () => <Zap size={20} />,
  "/settings": () => <Icons.Settings size={20} />,
} as const;

const items = [
  { path: "/overview", name: "Dashboard" },
  { path: "/customers", name: "Customers" },
  { path: "/virtual-accounts", name: "Virtual Accounts" },
  { path: "/transactions", name: "Transactions" },
  { path: "/invoices", name: "Invoices" },
  { path: "/reconciliation", name: "Reconciliation" },
  // { path: "/automation", name: "Automation" },
  { path: "/settings", name: "Settings" },
];

interface ItemProps {
  item: (typeof items)[number];
  isActive: boolean;
  isExpanded: boolean;
}

const Item = ({ item, isActive, isExpanded }: ItemProps) => {
  const Icon = icons[item.path as keyof typeof icons];

  return (
    <div className="group">
      <Link to={item.path} className="group">
        <div className="relative">
          <div
            className={cn(
              "border border-transparent h-[40px] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ml-[15px] mr-[15px]",
              isActive &&
                "bg-[#f7f7f7] dark:bg-[#131313] border-[#e6e6e6] dark:border-[#1d1d1d]",
              isExpanded ? "w-[calc(100%-30px)]" : "w-[40px]",
            )}
          />

          <div className="absolute top-0 left-[15px] w-[40px] h-[40px] flex items-center justify-center dark:text-[#666666] text-black group-hover:!text-primary pointer-events-none">
            <div className={cn(isActive && "dark:!text-white")}>
              <Icon />
            </div>
          </div>

          {isExpanded && (
            <div className="absolute top-0 left-[55px] right-[4px] h-[40px] flex items-center pointer-events-none">
              <span
                className={cn(
                  "text-sm font-medium transition-opacity duration-200 ease-in-out text-[#666] group-hover:text-primary",
                  "whitespace-nowrap overflow-hidden",
                  isActive && "text-primary",
                )}
              >
                {item.name}
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

type Props = {
  onSelect?: () => void;
  isExpanded?: boolean;
};

export function MainMenu({ onSelect, isExpanded = false }: Props) {
  const { pathname } = useLocation();
  const part = pathname?.split("/")[1];

  return (
    <div className="mt-4 w-full">
      <nav className="w-full">
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const isActive =
              (pathname === "/" && item.path === "/overview") ||
              (pathname !== "/" && item.path.startsWith(`/${part}`));

            return (
              <Item
                key={item.path}
                item={item}
                isActive={isActive}
                isExpanded={isExpanded}
              />
            );
          })}
        </div>
      </nav>
    </div>
  );
}
