"use client";

import { SheetHeader } from "ui/sheet";
import { Skeleton } from "ui/skeleton";

export function DocumentDetailsSkeleton() {
  return (
    <div className="flex flex-col flex-grow min-h-0 relative h-full w-full">
      <SheetHeader className="mb-4 flex justify-between items-center flex-row">
        <div className="min-w-0 flex-1 max-w-[50%] flex flex-row gap-2 items-end">
          <Skeleton className="h-6 w-3/4" />
        </div>
      </SheetHeader>

      <div className="h-full max-h-[763px] p-0 overflow-hidden">
        <Skeleton className="h-full w-full" />
      </div>

      <div className="pt-4">
        <Skeleton className="h-4 w-full mb-4" />
        <div className="flex gap-2 flex-wrap mb-6">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}
