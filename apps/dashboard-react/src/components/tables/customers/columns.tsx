"use client";

import type { RouterOutputs } from "api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "ui/alert-dialog";
import { Avatar, AvatarFallback } from "ui/avatar";
import { Button } from "ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { memo, useCallback } from "react";
import { useCustomerParams } from "@/hooks/use-customer-params";

export type Customer = RouterOutputs["customers"]["get"]["data"][number];

const NameCell = memo(({ name }: { name: string | null }) => {
  if (!name) return "-";

  return (
    <div className="flex items-center space-x-2">
      <Avatar className="size-5">
        <AvatarFallback className="text-[9px] font-medium">
          {name[0]}
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{name}</span>
    </div>
  );
});

NameCell.displayName = "NameCell";

const ActionsCell = memo(
  ({
    customerId,
    customerName,
    onDelete,
  }: {
    customerId: string;
    customerName: string | null;
    onDelete?: (id: string) => void;
  }) => {
    const { setParams } = useCustomerParams();

    const handleEdit = useCallback(() => {
      setParams({ customerId });
    }, [customerId, setParams]);

    return (
      <div className="flex items-center justify-center w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="relative">
            <Button variant="ghost" className="h-8 w-8 p-0">
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              Edit customer
            </DropdownMenuItem>

            <AlertDialog>
              <DropdownMenuItem className="text-destructive" asDialogTrigger>
                <AlertDialogTrigger>Delete</AlertDialogTrigger>
              </DropdownMenuItem>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete customer</AlertDialogTitle>
                  <AlertDialogDescription>
                    {customerName
                      ? `This will permanently delete ${customerName} and remove their data. Customers with open invoices cannot be deleted.`
                      : "This will permanently delete this customer and remove their data. Customers with open invoices cannot be deleted."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => onDelete?.(customerId)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
);

ActionsCell.displayName = "ActionsCell";

export const columns: ColumnDef<Customer>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    size: 320,
    minSize: 240,
    maxSize: 500,
    enableResizing: true,
    meta: {
      sticky: true,
      skeleton: { type: "avatar-text", width: "w-32" },
      headerLabel: "Name",
      className:
        "w-[320px] min-w-[240px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-20",
    },
    cell: ({ row }) => <NameCell name={row.original.name} />,
  },
  {
    id: "email",
    accessorKey: "email",
    header: "Email",
    size: 300,
    minSize: 220,
    maxSize: 450,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-32" },
      headerLabel: "Email",
      className: "w-[300px] min-w-[220px]",
    },
    cell: ({ row }) => row.getValue("email") ?? "-",
  },
  {
    id: "phone",
    accessorKey: "phone",
    header: "Phone",
    size: 180,
    minSize: 140,
    maxSize: 260,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-24" },
      headerLabel: "Phone",
      className: "w-[180px] min-w-[140px]",
    },
    cell: ({ row }) => row.original.phone ?? "-",
  },
  {
    id: "country",
    accessorKey: "country",
    header: "Country",
    size: 150,
    minSize: 120,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-16" },
      headerLabel: "Country",
      sortField: "country",
      className: "w-[150px] min-w-[120px]",
    },
    cell: ({ row }) => row.original.country ?? "-",
  },
  {
    id: "invoices",
    accessorKey: "invoices",
    header: "Invoices",
    size: 120,
    minSize: 100,
    maxSize: 180,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-8" },
      headerLabel: "Invoices",
      className: "w-[120px] min-w-[100px]",
    },
    cell: ({ row }) => {
      if (row.original.invoiceCount > 0) {
        return (
          <Link href={`/invoices?customers=${row.original.id}`}>
            {row.original.invoiceCount}
          </Link>
        );
      }

      return "-";
    },
  },
  {
    id: "actions",
    header: "Actions",
    size: 100,
    minSize: 100,
    maxSize: 100,
    enableResizing: false,
    enableSorting: false,
    enableHiding: false,
    meta: {
      sticky: true,
      skeleton: { type: "icon" },
      headerLabel: "Actions",
      className:
        "text-right sticky right-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-30 justify-center !border-l !border-border",
    },
    cell: ({ row, table }) => (
      <ActionsCell
        customerId={row.original.id}
        customerName={row.original.name}
        onDelete={table.options.meta?.deleteCustomer}
      />
    ),
  },
];
