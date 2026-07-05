import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Button } from "ui/button";
import { Input } from "ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { useTRPCClient, useTRPC } from "@/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "ui/use-toast";

type InviteBusinessMembersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteBusinessMembersModal({
  open,
  onOpenChange,
}: InviteBusinessMembersModalProps) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [sending, setSending] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || sending) return;
      setSending(true);
      try {
        const result = await trpcClient.business.invite.mutate([{ email, role }]);
        queryClient.invalidateQueries({ queryKey: trpc.business.businessInvites.queryKey() });

        if (result.sent > 0) {
          toast({ title: "Invite sent" });
          setEmail("");
          onOpenChange(false);
        } else if (result.skipped > 0) {
          const reason = result.results[0]?.reason;
          const msg = reason === "already_member" ? "Already a member" : reason === "already_invited" ? "Already invited" : "Could not send invite";
          toast({ title: msg, variant: "destructive" });
        }
      } catch (err) {
        toast({ title: "Failed to send invite", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
      } finally {
        setSending(false);
      }
    },
    [email, role, sending, trpcClient, trpc, queryClient, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[455px]">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Invite Members</DialogTitle>
            <DialogDescription>
              Invite new members by email address.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  placeholder="jane@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as "member" | "admin")}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={sending}>
                {sending ? "Sending..." : "Invite"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
