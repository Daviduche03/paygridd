"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Table, TableBody } from "ui/table";
import { TableRow } from "./table-row";

type Props = {
  data: RouterOutputs["business"]["list"];
};

export function SelectBusinessTable({ data }: Props) {
  return (
    <Table>
      <TableBody className="border-none">
        {data.map((row) => (
          <TableRow key={row.id} row={row} />
        ))}
      </TableBody>
    </Table>
  );
}
