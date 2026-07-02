import { cn } from "ui/cn";
import { Skeleton } from "ui/skeleton";
import { KpiGrid, kpiCardClassName, surfaceCardClassName } from "@/components/surface-card";

export function SummarySkeleton() {
  return (
    <div className="mt-1 flex w-full max-w-2xl flex-col gap-3">
      <Skeleton className="h-[14px] w-[320px]" />
    </div>
  );
}

export function WidgetCardsSkeleton() {
  return (
    <KpiGrid className="grid-cols-2 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={`card-${i}`} className={cn(surfaceCardClassName(), kpiCardClassName)}>
          <Skeleton className="mb-2 h-[14px] w-[80px]" />
          <Skeleton className="h-[28px] w-[100px]" />
        </div>
      ))}
    </KpiGrid>
  );
}
