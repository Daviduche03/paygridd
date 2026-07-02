import { Skeleton } from "ui/skeleton";

export function BusinessesSkeleton() {
  return (
    <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
      <div className="m-auto w-full max-w-[480px] flex flex-col items-center gap-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />

        <div className="w-full space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
