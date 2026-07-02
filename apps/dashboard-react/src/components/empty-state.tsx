"use client";

import { Button } from "ui/button";
import { cn } from "ui/cn";
import Link from "@/next/link";
import type { ReactNode } from "react";

export type EmptyStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  size?: "sm" | "default";
};

export type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: EmptyStateAction;
  className?: string;
  iconContainerClassName?: string;
  bordered?: boolean;
};

function EmptyStateActionButton({ action }: { action: EmptyStateAction }) {
  const content = (
    <>
      {action.icon}
      {action.label}
    </>
  );

  if (action.href) {
    return (
      <Button size={action.size ?? "sm"} asChild>
        <Link href={action.href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button size={action.size ?? "sm"} onClick={action.onClick}>
      {content}
    </Button>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  iconContainerClassName,
  bordered = true,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20",
        bordered && "border border-dashed border-border bg-card",
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 flex size-12 items-center justify-center rounded-full bg-muted",
          iconContainerClassName,
        )}
      >
        {icon}
      </div>
      <h3 className="mb-1 font-medium">{title}</h3>
      <p
        className={cn(
          "max-w-md text-center text-sm text-muted-foreground",
          action && "mb-6",
        )}
      >
        {description}
      </p>
      {action ? <EmptyStateActionButton action={action} /> : null}
    </div>
  );
}
