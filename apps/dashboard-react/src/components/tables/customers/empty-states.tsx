"use client";

import { Icons } from "ui/icons";
import { EmptyState as EmptyStateCard } from "@/components/empty-state";
import { useCustomerParams } from "@/hooks/use-customer-params";

export function EmptyState() {
  const { setParams } = useCustomerParams();

  return (
    <EmptyStateCard
      className="py-24"
      icon={<Icons.Customers className="size-5 text-muted-foreground" />}
      title="No customers yet"
      description="Create your first customer to provision virtual accounts and track payments."
      action={{
        label: "Create customer",
        onClick: () => setParams({ createCustomer: true }),
      }}
    />
  );
}

export function NoResults() {
  const { setParams } = useCustomerParams();

  return (
    <EmptyStateCard
      className="py-24"
      icon={<Icons.Search className="size-5 text-muted-foreground" />}
      title="No results"
      description="Try another search or adjust your filters."
      action={{
        label: "Clear filters",
        onClick: () => setParams(null),
      }}
    />
  );
}
