"use client";

import { SettingsTabs } from "@/components/settings-tabs";
import { ScrollableContent } from "@/components/scrollable-content";
import { ConnectedAccounts } from "@/components/connected-accounts";

export default function AccountsPage() {
  return (
    <ScrollableContent>
      <div className="pt-6">
        <SettingsTabs />
        <div className="space-y-12">
          <ConnectedAccounts />
        </div>
      </div>
    </ScrollableContent>
  );
}
