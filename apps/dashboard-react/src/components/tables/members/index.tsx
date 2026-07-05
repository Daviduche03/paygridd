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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useTRPC, useTRPCClient } from "@/trpc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "ui/use-toast";
import { useState } from "react";

export function DataTable() {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const [removing, setRemoving] = useState<string | null>(null);

  const { data: userData } = useQuery(trpc.user.me.queryOptions());
  const { data: membersData, isLoading } = useQuery(
    trpc.business.members.queryOptions(),
  );

  const currentRole = userData?.businessRole;
  const isOwner = currentRole === "owner";
  const isAdmin = currentRole === "admin";
  const canManage = isOwner || isAdmin;

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      await trpcClient.business.deleteMember.mutate({ memberId: id });
      queryClient.invalidateQueries({ queryKey: trpc.business.members.queryKey() });
      toast({ title: "Member removed" });
    } catch (err) {
      toast({ title: "Failed to remove member", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setRemoving(null);
    }
  };

  const handleChangeRole = async (id: string, role: string) => {
    try {
      await trpcClient.business.updateMember.mutate({ memberId: id, role: role as "admin" | "member" });
      queryClient.invalidateQueries({ queryKey: trpc.business.members.queryKey() });
      toast({ title: "Role updated" });
    } catch (err) {
      toast({ title: "Failed to update role", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  const members = membersData ?? [];

  if (!members.length) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No members yet. Invite someone to get started.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          {canManage && <TableHead className="w-10" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {(member.name ?? member.email)[0]?.toUpperCase()}
                  </div>
                )}
                <span>{member.name ?? "—"}</span>
              </div>
            </TableCell>
            <TableCell>{member.email}</TableCell>
            <TableCell className="capitalize">{member.role}</TableCell>
            {canManage && member.role !== "owner" && (
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <DotsHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {member.role !== "admin" && isOwner && (
                      <DropdownMenuItem onClick={() => handleChangeRole(member.id, "admin")}>
                        Promote to Admin
                      </DropdownMenuItem>
                    )}
                    {member.role !== "member" && (
                      <DropdownMenuItem onClick={() => handleChangeRole(member.id, "member")}>
                        Demote to Member
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      disabled={removing === member.id}
                      onClick={() => handleRemove(member.id)}
                    >
                      {removing === member.id ? "Removing..." : "Remove"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
