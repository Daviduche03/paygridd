import { cn } from "ui/cn";
import { Skeleton } from "ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "ui/table";
import { KpiGrid, kpiCardClassName, surfaceCardClassName } from "@/components/surface-card";

export function TransactionsKpiSkeleton() {
  return (
    <KpiGrid className="grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={cn(surfaceCardClassName(), kpiCardClassName, "space-y-2")}>
          <Skeleton className="h-[14px] w-[80px]" />
          <Skeleton className="h-[28px] w-[100px]" />
        </div>
      ))}
    </KpiGrid>
  );
}

export function TransactionsTableSkeleton() {
  const cols = [40, 110, 140, 200, 140, 110, 80, 100, 130, 120, 130, 70];

  return (
    <div className={cn("w-full border border-border")}>
      <Table>
        <TableHeader>
          <TableRow className="h-[45px] flex items-center">
            {cols.map((w, i) => (
              <TableHead
                key={i}
                className="flex items-center"
                style={{ width: w, minWidth: w, maxWidth: w }}
              >
                {i === 0 ? (
                  <Skeleton className="h-4 w-4" />
                ) : (
                  <Skeleton className="h-3.5 w-16" />
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, row) => (
            <TableRow key={row} className="group h-[45px] flex items-center border-b border-border">
              {cols.map((w, col) => (
                <TableCell
                  key={col}
                  className="flex items-center"
                  style={{ width: w, minWidth: w, maxWidth: w }}
                >
                  <Skeleton className={col === 0 ? "h-4 w-4" : col === 11 ? "h-3.5 w-14" : "h-3.5 w-20"} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
