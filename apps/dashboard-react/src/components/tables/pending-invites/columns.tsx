import type { ColumnDef } from "@tanstack/react-table";

export type PendingInvite = {
  id: string;
  email: string;
  role: string;
};

export const columns: ColumnDef<PendingInvite>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
];
