"use client";

import { LogEvents } from "eventbus/events";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "ui/accordion";
import { cn } from "ui/cn";
import { Label } from "ui/label";
import { Skeleton } from "ui/skeleton";
import { getTaxTypeLabel } from "utils/tax";
import { useOpenPanel } from "@openpanel/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useInvalidateTransactionQueries } from "@/hooks/use-invalidate-transaction-queries";
import { useTransactionParams } from "@/hooks/use-transaction-params";
import { useUpdateTransactionCategory } from "@/hooks/use-update-transaction-category";
import { useTRPC } from "@/trpc/client";
import { AssignUser } from "./assign-user";
import { FormatAmount } from "./format-amount";
import { Note } from "./note";
import { TaxAmount } from "./tax-amount";
import { TransactionShortcuts } from "./transaction-shortcuts";

export function TransactionDetails() {
  const trpc = useTRPC();
  const { transactionId } = useTransactionParams();
  const queryClient = useQueryClient();
  const { track } = useOpenPanel();
  const invalidateTransactionQueries = useInvalidateTransactionQueries();

  const { updateCategory } = useUpdateTransactionCategory({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.transactions.getById.queryKey({ id: transactionId! }),
      });
    },
  });

  const { data, isLoading } = useQuery({
    ...trpc.transactions.getById.queryOptions({ id: transactionId! }),
    enabled: Boolean(transactionId),
    staleTime: 30 * 1000, // 30 seconds - prevents excessive refetches when reopening
    // Use placeholderData instead of initialData to show cached list data while fetching
    // This ensures React Query always fetches fresh data (including suggestion details)
    // while still providing immediate UI feedback from the list cache
    placeholderData: () => {
      const pages = queryClient
        .getQueriesData({ queryKey: trpc.transactions.get.infiniteQueryKey() })
        // @ts-expect-error
        .flatMap(([, data]) => data?.pages ?? [])
        .flatMap((page) => page.data ?? []);

      return pages.find((d) => d.id === transactionId);
    },
  });

  const updateTransactionMutation = useMutation(
    trpc.transactions.update.mutationOptions({
      onSuccess: (_, variables) => {
        track(LogEvents.TransactionUpdated.name);
        if ("categorySlug" in variables) {
          track(LogEvents.TransactionCategoryChanged.name, {
            category: variables.categorySlug,
          });
        }
        if ("categorySlug" in variables || "internal" in variables) {
          invalidateTransactionQueries();
        } else {
          queryClient.invalidateQueries({
            queryKey: trpc.transactions.get.infiniteQueryKey(),
          });
        }
      },
      onMutate: async (variables) => {
        // Cancel any outgoing refetches
        await Promise.all([
          queryClient.cancelQueries({
            queryKey: trpc.transactions.getById.queryKey({
              id: transactionId!,
            }),
          }),
          queryClient.cancelQueries({
            queryKey: trpc.transactions.get.infiniteQueryKey(),
          }),
        ]);

        // Snapshot the previous values
        const previousData = {
          details: queryClient.getQueryData(
            trpc.transactions.getById.queryKey({ id: transactionId! }),
          ),
          list: queryClient.getQueryData(
            trpc.transactions.get.infiniteQueryKey(),
          ),
        };

        // Optimistically update details view
        queryClient.setQueryData(
          trpc.transactions.getById.queryKey({ id: transactionId! }),
          (old: any) => {
            return {
              ...old,
              ...variables,
            };
          },
        );

        // Optimistically update list view
        queryClient.setQueryData(
          trpc.transactions.get.infiniteQueryKey(),
          (old: any) => {
            if (!old?.pages) return old;

            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                data: page.data.map((transaction: any) =>
                  transaction.id === transactionId
                    ? {
                        ...transaction,
                        ...variables,
                      }
                    : transaction,
                ),
              })),
            };
          },
        );

        return { previousData };
      },
      onError: (_, __, context) => {
        // Revert both caches on error
        queryClient.setQueryData(
          trpc.transactions.getById.queryKey({ id: transactionId! }),
          context?.previousData.details,
        );
        queryClient.setQueryData(
          trpc.transactions.get.infiniteQueryKey(),
          context?.previousData.list,
        );
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey({ id: transactionId! }),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });
      },
    }),
  );

  if (isLoading || !data) {
    return (
      <div className="h-[calc(100vh-80px)] scrollbar-hide overflow-auto pb-12">
        <div className="flex justify-between mb-8">
          <div className="flex-1 flex-col">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2 items-center">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="w-[100px] h-[14px]" />
              </div>
              <Skeleton className="w-[80px] h-[14px]" />
            </div>

            <div className="mt-6 mb-3">
              <Skeleton className="w-[35%] h-[22px]" />
            </div>

            <div className="flex flex-col w-full space-y-1">
              <Skeleton className="w-[50%] h-[36px]" />
              <Skeleton className="w-[60px] h-[12px]" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 mb-2">
          <div>
            <Skeleton className="w-[60px] h-[14px] mb-2" />
            <Skeleton className="w-full h-[36px]" />
          </div>
          <div>
            <Skeleton className="w-[50px] h-[14px] mb-2" />
            <Skeleton className="w-full h-[36px]" />
          </div>
        </div>

        <div className="mt-6">
          <Skeleton className="w-[40px] h-[14px] mb-2" />
          <Skeleton className="w-full h-[36px]" />
        </div>

        <div className="mt-8 space-y-4">
          <Skeleton className="w-full h-[20px]" />
          <Skeleton className="w-full h-[20px]" />
          <Skeleton className="w-full h-[20px]" />
        </div>
      </div>
    );
  }

  const defaultValue = data?.note ? ["note"] : [];

  return (
    <div className="h-[calc(100vh-80px)] scrollbar-hide overflow-auto pb-12">
      <div className="flex justify-between mb-8">
        <div className="flex-1 flex-col">
          {isLoading ? (
            <div className="flex items-center justify-between  mt-1 mb-6">
              <div className="flex space-x-2 items-center">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="w-[100px] h-[14px] rounded-full" />
              </div>
              <Skeleton className="w-[10%] h-[14px] rounded-full" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[#606060] text-xs select-text">
                {data?.date && format(parseISO(data.date), "MMM d, y")}
              </span>
            </div>
          )}

          <h2 className="mt-6 mb-3 select-text">
            {isLoading ? (
              <Skeleton className="w-[35%] h-[22px] rounded-md mb-2" />
            ) : (
              data?.name
            )}
          </h2>
          <div className="flex justify-between items-center">
            <div className="flex flex-col w-full space-y-1">
              {isLoading ? (
                <Skeleton className="w-[50%] h-[30px] rounded-md mb-2" />
              ) : (
                <span
                  className={cn(
                    "text-4xl select-text font-serif",
                    data?.amount > 0 && "text-[#00C969]",
                  )}
                >
                  <FormatAmount
                    amount={data?.amount}
                    currency={data?.currency}
                  />
                </span>
              )}
              <div className="h-3">
                {data?.taxAmount && data.taxAmount > 0 ? (
                  <span className="text-[#606060] text-xs select-text">
                    {data.taxType && `${getTaxTypeLabel(data.taxType)} `}
                    <FormatAmount
                      amount={data.taxAmount}
                      currency={data.currency}
                      maximumFractionDigits={2}
                    />
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {data?.description && (
        <div className="border dark:bg-[#1A1A1A]/95 px-4 py-3 text-sm text-popover-foreground select-text">
          {data.description}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-6 mb-2">
        <div>
          <Label htmlFor="category" className="mb-2 block">
            Category
          </Label>
        </div>

        <div>
          <Label htmlFor="assign" className="mb-2 block">
            Assign
          </Label>

          {isLoading ? (
            <div className="h-[36px] border">
              <Skeleton className="h-[14px] w-[60%] absolute left-3 top-[39px]" />
            </div>
          ) : (
            <AssignUser
              selectedId={data?.assigned?.id ?? undefined}
              onSelect={(user) => {
                if (user) {
                  updateTransactionMutation.mutate({
                    id: data?.id,
                    assignedId: user.id,
                  });
                }
              }}
            />
          )}
        </div>
      </div>

      <Accordion type="multiple" defaultValue={defaultValue}>
        <AccordionItem value="general">
          <AccordionTrigger>General</AccordionTrigger>
          <AccordionContent className="select-text">
            <div className="mb-4 border-b pb-4">
              <Label className="mb-2 block font-medium text-md">
                Exclude from reports
              </Label>
              <div className="flex flex-row items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs text-muted-foreground">
                    Exclude this transaction from reports like profit, expense
                    and revenue. This is useful for internal transfers between
                    accounts to avoid double-counting.
                  </p>
                </div>

                <Switch
                  checked={data?.internal ?? false}
                  onCheckedChange={(checked) => {
                    updateTransactionMutation.mutate({
                      id: data?.id,
                      internal: checked,
                    });
                  }}
                />
              </div>
            </div>

            <TaxAmount
              transactionId={data?.id}
              amount={data?.amount}
              currency={data?.currency}
              taxRate={data?.taxRate}
              taxAmount={data?.taxAmount}
              taxType={data?.taxType}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="note">
          <AccordionTrigger>Note</AccordionTrigger>
          <AccordionContent className="select-text">
            <Note
              defaultValue={data?.note ?? ""}
              onChange={(value) => {
                updateTransactionMutation.mutate({
                  id: data?.id,
                  note: value,
                });
              }}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <TransactionShortcuts
        isFulfilled={data?.isFulfilled ?? false}
        status={data?.status ?? ""}
      />
    </div>
  );
}
