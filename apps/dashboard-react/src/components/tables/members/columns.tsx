import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";

export type Member = {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: string;
  avatarUrl: string | null;
};

type ColumnMeta = {
  currentUserRole?: string;
  onRemove?: (memberId: string) => void;
  onChangeRole?: (memberId: string, role: string) => void;
};

export const columns: ColumnDef<Member>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.avatarUrl ? (
          <img
            src={row.original.avatarUrl}
            alt=""
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
            {(row.original.name ?? row.original.email)[0]?.toUpperCase()}
          </div>
        )}
        <span>{row.original.name ?? "—"}</span>
      </div>
    ),
  },
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
      const member = row.original;

      if (!meta?.currentUserRole || meta.currentUserRole === "member") {
        return null;
      }

      if (member.role === "owner") {
        return null;
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {member.role !== "admin" && meta.currentUserRole === "owner" && (
              <DropdownMenuItem
                onClick={() => meta.onChangeRole?.(member.id, "admin")}
              >
                Promote to Admin
              </DropdownMenuItem>
            )}
            {member.role !== "member" && (
              <DropdownMenuItem
                onClick={() => meta.onChangeRole?.(member.id, "member")}
              >
                Demote to Member
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => meta.onRemove?.(member.id)}
            >
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
