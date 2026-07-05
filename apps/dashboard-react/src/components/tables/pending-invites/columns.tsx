import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "ui/button";
import { Cross2Icon } from "@radix-ui/react-icons";

export type PendingInvite = {
  id: string;
  email: string;
  role: string;
};

type ColumnMeta = {
  onCancel?: (inviteId: string) => void;
};

export const columns: ColumnDef<PendingInvite>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.role}</span>
    ),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const meta = table.options.meta as ColumnMeta | undefined;
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-destructive"
          onClick={() => meta?.onCancel?.(row.original.id)}
        >
          <Cross2Icon className="h-3 w-3 mr-1" />
          Cancel
        </Button>
      );
    },
  },
];
