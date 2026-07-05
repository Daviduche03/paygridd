import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { Button } from "ui/button";
import { PlusIcon } from "@radix-ui/react-icons";
import { DataTable as MembersTable } from "./tables/members";
import { DataTable as PendingInvitesTable } from "./tables/pending-invites";
import { InviteBusinessMembersModal } from "./modals/invite-business-members-modal";

export function BusinessMembers() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <Tabs defaultValue="members">
      <div className="flex items-center justify-between mb-4">
        <TabsList className="bg-transparent border-b-[1px] w-full justify-start rounded-none p-0 h-auto pb-4">
          <TabsTrigger value="members" className="p-0 m-0 mr-4">
            Members
          </TabsTrigger>
          <TabsTrigger value="pending" className="p-0 m-0">
            Pending Invitations
          </TabsTrigger>
        </TabsList>

        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-1" />
          Invite
        </Button>
      </div>

      <TabsContent value="members">
        <MembersTable />
      </TabsContent>

      <TabsContent value="pending">
        <PendingInvitesTable />
      </TabsContent>

      <InviteBusinessMembersModal open={inviteOpen} onOpenChange={setInviteOpen} />
    </Tabs>
  );
}