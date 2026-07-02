"use client";

import { useState, useCallback } from "react";
import { Button } from "ui/button";
import { Icons } from "ui/icons";
import { ScrollableContent } from "@/components/scrollable-content";
import { DataTable } from "@/components/tables/customers/data-table";
import { CustomerDetailPanel } from "@/components/customer-detail-panel";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { useCustomerParams } from "@/hooks/use-customer-params";

export default function CustomersPage() {
  const { setParams } = useCustomerParams();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  const handleSelectCustomer = useCallback((id: string) => {
    setSelectedCustomerId(id);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedCustomerId(null);
  }, []);

  return (
    <ScrollableContent>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 pt-6">
          <div>
            <h1 className="text-xl font-semibold">Customers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage customers, their dedicated virtual accounts, payment history, and reconciliation status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!selectedCustomerId && (
              <Button
                size="sm"
                onClick={() => setParams({ createCustomer: true })}
              >
                <Icons.Add className="size-4 mr-1" />
                Create Customer
              </Button>
            )}
            {selectedCustomerId && (
              <Button variant="outline" size="sm" onClick={handleBack}>
                <Icons.ChevronLeft className="size-4 mr-1" />
                Back to list
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {selectedCustomerId ? (
            <CustomerDetailPanel
              customerId={selectedCustomerId}
              onBack={handleBack}
            />
          ) : (
            <ErrorBoundary fallback={<ErrorFallback />}>
              <DataTable
                initialSettings={undefined}
                onSelectCustomer={handleSelectCustomer}
              />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </ScrollableContent>
  );
}
