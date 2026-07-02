"use client";

import { transformCustomerToContent } from "invoice/utils";
import { Button } from "ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { useQuery } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useTRPC } from "@/trpc/client";

export function SelectCustomer() {
  const trpc = useTRPC();
  const { setParams: setCustomerParams } = useCustomerParams();
  const { setValue, trigger } = useFormContext();

  const { data: customers } = useQuery(
    trpc.customers.get.queryOptions({
      pageSize: 100,
    }),
  );

  const applyCustomer = (customer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  }) => {
    setValue("customerId", customer.id, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("customerName", customer.name, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("customerDetails", transformCustomerToContent(customer), {
      shouldValidate: true,
      shouldDirty: true,
    });
    trigger();
  };

  const handleSelect = (value: string) => {
    if (value === "create-customer") {
      setCustomerParams({ createCustomer: true });
      return;
    }

    const customer = customers?.data?.find((item) => item.id === value);
    if (customer) {
      applyCustomer(customer);
    }
  };

  if (!customers?.data?.length) {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={() => setCustomerParams({ createCustomer: true })}
        className="text-[#434343] p-0 text-[11px] h-auto hover:bg-transparent"
      >
        Select customer
      </Button>
    );
  }

  return (
    <Select onValueChange={handleSelect}>
      <SelectTrigger className="h-8 w-full max-w-[240px] border-0 px-0 text-[11px] text-[#434343] shadow-none focus:ring-0">
        <SelectValue placeholder="Select customer" />
      </SelectTrigger>
      <SelectContent className="z-[90]">
        {customers.data.map((customer) => (
          <SelectItem key={customer.id} value={customer.id} className="text-xs">
            {customer.name}
          </SelectItem>
        ))}
        <SelectItem value="create-customer" className="text-xs">
          Create customer
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
