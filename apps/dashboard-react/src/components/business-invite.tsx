"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { SubmitButton } from "ui/submit-button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";

type Props = {
  invite: RouterOutputs["business"]["invitesByEmail"][number];
};

export function BusinessInvite({ invite }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const switchBusinessMutation = useMutation(
    trpc.user.switchBusiness.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
        router.push("/");
      },
    }),
  );

  const acceptInviteMutation = useMutation(
    trpc.business.acceptInvite.mutationOptions({
      onSuccess: (data) => {
        if (!data.businessId) {
          return;
        }

        // Switch to the newly joined business
        switchBusinessMutation.mutate({
          businessId: data.businessId,
        });
      },
    }),
  );

  const declineInviteMutation = useMutation(
    trpc.business.declineInvite.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.business.invitesByEmail.queryKey(),
        });
      },
    }),
  );

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Avatar className="size-8 rounded-none">
          <AvatarImage
            src={invite.business?.logoUrl ?? ""}
            className="rounded-none"
            width={32}
            height={32}
          />
          <AvatarFallback className="rounded-none">
            <span className="text-xs">
              {invite.business?.name?.charAt(0)?.toUpperCase()}
            </span>
          </AvatarFallback>
        </Avatar>

        <span className="text-sm font-medium">{invite.business?.name}</span>
      </div>

      <div className="flex gap-2">
        <SubmitButton
          isSubmitting={acceptInviteMutation.isPending}
          variant="outline"
          onClick={() =>
            acceptInviteMutation.mutate({
              id: invite.id,
            })
          }
        >
          Accept
        </SubmitButton>
        <SubmitButton
          isSubmitting={declineInviteMutation.isPending}
          variant="outline"
          onClick={() =>
            declineInviteMutation.mutate({
              id: invite.id,
            })
          }
        >
          Decline
        </SubmitButton>
      </div>
    </div>
  );
}
