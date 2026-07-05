"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { LogEvents } from "eventbus/events";
import { Button } from "ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "ui/form";
import { Input } from "ui/input";
import { SubmitButton } from "ui/submit-button";
import { EmailTagInput } from "ui/email-tag-input";
import { isValidEmailList } from "utils";
import { useOpenPanel } from "@openpanel/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod/v3";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { CountrySelector } from "../country-selector";

const formSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Email is not valid.",
  }),
  billingEmail: z.string().nullable().optional().refine(isValidEmailList, {
    message: "All emails must be valid and unique.",
  }),
  phone: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
});

type Props = {
  data?: RouterOutputs["customers"]["getById"];
};

export function CustomerForm({ data }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { track } = useOpenPanel();
  const isEdit = !!data;

  const { setParams: setCustomerParams, name } = useCustomerParams();
  const { setParams: setInvoiceParams, invoiceType } = useInvoiceParams();
  const fromInvoice = invoiceType === "create" || invoiceType === "edit";

  const upsertCustomerMutation = useMutation(
    trpc.customers.upsert.mutationOptions({
      onSuccess: (data) => {
        if (!isEdit) {
          track(LogEvents.CustomerCreated.name);
        }

        queryClient.invalidateQueries({
          queryKey: trpc.customers.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.customers.get.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.customers.getById.queryKey(),
        });

        setCustomerParams(null);

        if (data && fromInvoice) {
          setInvoiceParams({ selectedCustomerId: data.id });
        }
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      id: data?.id,
      name: name ?? data?.name ?? undefined,
      email: data?.email ?? undefined,
      billingEmail: data?.billingEmail ?? null,
      phone: data?.phone ?? undefined,
      country: data?.country ?? undefined,
      countryCode: data?.countryCode ?? undefined,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    upsertCustomerMutation.mutate({
      ...values,
      id: values.id || undefined,
      billingEmail: values.billingEmail || null,
      phone: values.phone || null,
      country: values.country || null,
      countryCode: values.countryCode || null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="h-[calc(100vh-180px)] scrollbar-hide overflow-auto">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      autoFocus
                      placeholder="Acme Inc"
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="acme@example.com"
                      type="email"
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billingEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Billing Email
                  </FormLabel>
                  <FormControl>
                    <EmailTagInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="finance@example.com, accounting@example.com"
                    />
                  </FormControl>
                  <FormDescription>
                    Additional emails to BCC when sending invoices.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Phone
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="+234 801 234 5678"
                      type="tel"
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="countryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Country
                  </FormLabel>
                  <FormControl>
                    <CountrySelector
                      defaultValue={field.value ?? ""}
                      onSelect={(code, countryName) => {
                        field.onChange(code);
                        form.setValue("country", countryName, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex justify-end mt-auto space-x-4">
            <Button
              variant="outline"
              onClick={() => setCustomerParams(null)}
              type="button"
            >
              Cancel
            </Button>

            <SubmitButton
              isSubmitting={upsertCustomerMutation.isPending}
              disabled={
                upsertCustomerMutation.isPending || !form.formState.isDirty
              }
            >
              {isEdit ? "Update" : "Create"}
            </SubmitButton>
          </div>
        </div>
      </form>
    </Form>
  );
}
