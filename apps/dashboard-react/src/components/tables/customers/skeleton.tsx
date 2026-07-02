"use client";

import type { ColumnSizingState, VisibilityState } from "@tanstack/react-table";
import { SurfaceCard } from "@/components/surface-card";
import { TableSkeleton } from "@/components/tables/core";
import { columns } from "./columns";

interface CustomersSkeletonProps {
  columnVisibility?: VisibilityState;
  columnSizing?: ColumnSizingState;
  columnOrder?: string[];
  isEmpty?: boolean;
}

export function CustomersSkeleton({
  columnVisibility = {},
  columnSizing = {},
  columnOrder = [],
  isEmpty = false,
}: CustomersSkeletonProps) {
  return (
    <SurfaceCard>
      <TableSkeleton
        columns={columns}
        rowCount={25}
        columnVisibility={columnVisibility}
        columnSizing={columnSizing}
        columnOrder={columnOrder}
        stickyColumnIds={["name"]}
        actionsColumnId="actions"
        isEmpty={isEmpty}
        borderless
      />
    </SurfaceCard>
  );
}
