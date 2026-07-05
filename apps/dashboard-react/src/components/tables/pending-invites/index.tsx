"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "ui/table";
import { Button } from "ui/button";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useTRPC, useTRPCClient } from "@/trpc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "ui/use-toast";
import { useState } from "react";

export function DataTable() {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState<string | null>(null);

  const { data: invitesData, isLoading } = useQuery(
    trpc.business.businessInvites.queryOptions(),
  );

  const handleCancel = async (inviteId: string) => {
    setCancelling(inviteId);
    try {
      await trpcClient.business.deleteInvite.mutate({ inviteId });
      queryClient.invalidateQueries({ queryKey: trpc.business.businessInvites.queryKey() });
      toast({ title: "Invitation cancelled" });
    } catch (err) {
      toast({ title: "Failed to cancel invite", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setCancelling(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  const invites = invitesData ?? [];

  if (!invites.length) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No pending invitations.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="w-20" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {invites.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell>{inv.email}</TableCell>
            <TableCell className="capitalize">{inv.role}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-destructive"
                disabled={cancelling === inv.id}
                onClick={() => handleCancel(inv.id)}
              >
                <Cross2Icon className="h-3 w-3 mr-1" />
                {cancelling === inv.id ? "..." : "Cancel"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
