"use client";

import type { Row, ColumnSizingState, VisibilityState } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { TableCell, TableRow } from "ui/table";
import { useCallback } from "react";

type Props = {
  row: Row<any>;
  virtualStart: number;
  rowHeight: number;
  getStickyStyle: (columnId: string) => React.CSSProperties | undefined;
  getStickyClassName: (columnId: string) => string | undefined;
  nonClickableColumns: Set<string>;
  onCellClick: (id?: string) => void;
  columnSizing: ColumnSizingState;
  columnOrder: string[];
  columnVisibility: VisibilityState;
};

export function VirtualRow({
  row,
  virtualStart,
  rowHeight,
  getStickyStyle,
  getStickyClassName,
  nonClickableColumns,
  onCellClick,
}: Props) {
  const handleCellClick = useCallback(
    (columnId: string) => {
      if (!nonClickableColumns.has(columnId)) {
        onCellClick(row.original?.id);
      }
    },
    [nonClickableColumns, onCellClick, row.original?.id],
  );

  return (
    <TableRow
      className="flex absolute"
      style={{
        transform: `translateY(${virtualStart}px)`,
        height: `${rowHeight}px`,
      }}
      data-index={row.index}
    >
      {row.getVisibleCells().map((cell) => {
        const columnId = cell.column.id;
        return (
          <TableCell
            key={cell.id}
            className={getStickyClassName(columnId)}
            style={{
              ...getStickyStyle(columnId),
              height: `${rowHeight}px`,
              width: cell.column.getSize(),
              cursor: nonClickableColumns.has(columnId) ? undefined : "pointer",
            }}
            onClick={() => handleCellClick(columnId)}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        );
      })}
    </TableRow>
  );
}
