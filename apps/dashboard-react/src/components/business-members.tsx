import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { DataTable as MembersTable } from "./tables/members";
import { DataTable as PendingInvitesTable } from "./tables/pending-invites";

export function BusinessMembers() {
  return (
    <Tabs defaultValue="members">
      <TabsList className="bg-transparent border-b-[1px] w-full justify-start rounded-none mb-1 p-0 h-auto pb-4">
        <TabsTrigger value="members" className="p-0 m-0 mr-4">
          Members
        </TabsTrigger>
        <TabsTrigger value="pending" className="p-0 m-0">
          Pending Invitations
        </TabsTrigger>
      </TabsList>

      <TabsContent value="members">
        <MembersTable />
      </TabsContent>

      <TabsContent value="pending">
        <PendingInvitesTable />
      </TabsContent>
    </Tabs>
  );
}
