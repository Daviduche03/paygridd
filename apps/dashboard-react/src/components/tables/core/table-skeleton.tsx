"use client";

import type { ColumnDef, ColumnSizingState, VisibilityState } from "@tanstack/react-table";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Skeleton } from "ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "ui/table";

type Props = {
  columns: ColumnDef<any>[];
  rowCount?: number;
  columnVisibility?: VisibilityState;
  columnSizing?: ColumnSizingState;
  columnOrder?: string[];
  stickyColumnIds?: string[];
  actionsColumnId?: string;
  isEmpty?: boolean;
  borderless?: boolean;
};

export function TableSkeleton({
  columns,
  rowCount = 10,
  columnVisibility,
  columnSizing,
  columnOrder,
}: Props) {
  const table = useReactTable({
    data: Array.from({ length: rowCount }).map(() => ({})),
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
      columnSizing,
      columnOrder,
    },
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
