import type { ColumnDef } from "@tanstack/react-table";

export type Member = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export const columns: ColumnDef<Member>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
];
