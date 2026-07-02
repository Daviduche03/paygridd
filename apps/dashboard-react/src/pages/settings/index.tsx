"use client";

import { SettingsTabs } from "@/components/settings-tabs";
import { CompanyLogo } from "@/components/company-logo";
import { CompanyName } from "@/components/company-name";
import { DeleteBusiness } from "@/components/delete-business";
import { ExportAllData } from "@/components/export-all-data";
import { BusinessIdSection } from "@/components/business-id-section";
import { ScrollableContent } from "@/components/scrollable-content";

export default function SettingsPage() {
  return (
    <ScrollableContent>
      <div className="pt-6">
        <SettingsTabs />
        <div className="space-y-12">
          <CompanyLogo />
          <CompanyName />
          <BusinessIdSection />
          <ExportAllData />
          <DeleteBusiness />
        </div>
      </div>
    </ScrollableContent>
  );
}
