"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Avatar, AvatarFallback, AvatarImageNext } from "ui/avatar";
import { SubmitButton } from "ui/submit-button";
import { TableRow as BaseTableRow, TableCell } from "ui/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTRPC } from "@/trpc/client";

type Props = {
  row: RouterOutputs["business"]["list"][number];
};

export function TableRow({ row }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const trpc = useTRPC();

  const changeBusinessMutation = useMutation(
    trpc.user.switchBusiness.mutationOptions({
      onMutate: () => {
        setIsLoading(true);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries();
        navigate("/overview", { replace: true });
      },
      onError: () => {
        setIsLoading(false);
      },
    }),
  );

  return (
    <BaseTableRow key={row.id} className="hover:bg-transparent">
      <TableCell className="border-r-[0px] py-4 px-0">
        <div className="flex items-center space-x-4">
          <Avatar className="size-8 rounded-none">
            {row.logoUrl && (
              <AvatarImageNext
                src={row.logoUrl}
                alt={row.name ?? ""}
                width={32}
                height={32}
              />
            )}
            <AvatarFallback className="rounded-none">
              <span className="text-xs">
                {row?.name?.charAt(0)?.toUpperCase()}
              </span>
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{row?.name}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-0">
        <div className="flex justify-end">
          <div className="flex space-x-3 items-center">
            <SubmitButton
              isSubmitting={isLoading}
              variant="outline"
              onClick={() => {
                changeBusinessMutation.mutate({
                  businessId: row.id!,
                });
              }}
            >
              Launch
            </SubmitButton>
          </div>
        </div>
      </TableCell>
    </BaseTableRow>
  );
}
