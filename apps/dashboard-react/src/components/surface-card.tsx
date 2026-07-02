import { cn } from "ui/cn";
import Link from "next/link";
import type { ReactNode } from "react";

export function surfaceCardClassName(className?: string) {
  return cn("border border-border bg-card", className);
}

export const kpiCardClassName = "p-4 transition-colors hover:bg-muted/50";

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
};

export function SurfaceCard({ children, className }: SurfaceCardProps) {
  return <div className={surfaceCardClassName(className)}>{children}</div>;
}

type SurfaceCardHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function SurfaceCardHeader({ children, className }: SurfaceCardHeaderProps) {
  return (
    <div className={cn("border-b border-border px-4 py-3", className)}>{children}</div>
  );
}

type KpiGridProps = {
  children: ReactNode;
  className?: string;
};

export function KpiGrid({ children, className }: KpiGridProps) {
  return <div className={cn("mb-6 grid gap-3", className)}>{children}</div>;
}

type KpiCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  valueClassName?: string;
  className?: string;
  size?: "default" | "compact";
};

export function KpiCard({
  label,
  value,
  detail,
  valueClassName,
  className,
  size = "default",
}: KpiCardProps) {
  return (
    <div className={cn(surfaceCardClassName(), kpiCardClassName, className)}>
      <p className="mb-2 text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          size === "default"
            ? "text-2xl font-medium tabular-nums"
            : "text-sm font-medium",
          valueClassName,
        )}
      >
        {value}
      </p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

type KpiCardLinkProps = KpiCardProps & {
  href: string;
};

export function KpiCardLink({
  href,
  label,
  value,
  detail,
  valueClassName,
  className,
}: KpiCardLinkProps) {
  return (
    <Link
      href={href}
      className={cn(surfaceCardClassName(), kpiCardClassName, "block", className)}
    >
      <p className="mb-2 text-sm text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-medium tabular-nums", valueClassName)}>{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </Link>
  );
}
