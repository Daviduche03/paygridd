"use client";

import { SettingsTabs } from "@/components/settings-tabs";
import { ScrollableContent } from "@/components/scrollable-content";
import { BusinessMembers } from "@/components/business-members";

export default function MembersPage() {
  return (
    <ScrollableContent>
      <div className="pt-6">
        <SettingsTabs />
        <BusinessMembers />
      </div>
    </ScrollableContent>
  );
}
