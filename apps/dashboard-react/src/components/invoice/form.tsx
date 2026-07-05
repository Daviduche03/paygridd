import { LogEvents } from "eventbus/events";
import { Button } from "ui/button";
import { Icons } from "ui/icons";
import { ScrollArea } from "ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "ui/tooltip";
import { useToast } from "ui/use-toast";
import { useOpenPanel } from "@openpanel/nextjs";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useDebounceValue } from "usehooks-ts";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useUserQuery } from "@/hooks/use-user";
import { useInvoiceEditorStore } from "@/store/invoice-editor";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { SavingBar } from "../saving-bar";
import { CustomerDetails } from "./customer-details";
import { EditBlock } from "./edit-block";
import { EmailPreview } from "./email-preview";
import type { InvoiceFormValues } from "./form-context";
import { FromDetails } from "./from-details";
import { LineItems } from "./line-items";
import { Logo } from "./logo";
import { Meta } from "./meta";
import { NoteDetails } from "./note-details";
import { PaymentDetails } from "./payment-details";
import { SettingsMenu } from "./settings-menu";
import { SubmitButton } from "./submit-button";
import { Summary } from "./summary";
import { TemplateSelector } from "./template-selector";
import { transformFormValuesToDraft } from "./utils";

export function Form() {
  const { invoiceId, setParams } = useInvoiceParams();
  const { data: user } = useUserQuery();
  const { track } = useOpenPanel();

  const form = useFormContext();
  const token = form.watch("id");
  const deliveryType = form.watch("template.deliveryType");

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const draftInvoiceMutation = useMutation(
    trpc.invoice.draft.mutationOptions({
      onSuccess: (data) => {
        if (!invoiceId && data?.id) {
          setParams({ invoiceType: "edit", invoiceId: data.id });
        }

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.invoiceSummary.queryKey(),
        });
      },
    }),
  );

  const createInvoiceMutation = useMutation(
    trpc.invoice.create.mutationOptions({
      onSuccess: (data) => {
        track(LogEvents.InvoiceCreated.name);
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.getById.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.invoiceSummary.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.paymentStatus.queryKey(),
        });

        // Next suggested invoice number must advance after a successful send;
        // otherwise "Create another" resets from stale defaultSettings and shows
        // a duplicate-number validation error.
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.defaultSettings.queryKey(),
        });

        setParams({ invoiceType: "success", invoiceId: data.id });
      },
      onError: (error) => {
        // Check if this is a scheduling error using the specific error code
        if (error.data?.code === "SERVICE_UNAVAILABLE") {
          toast({
            title: "Scheduling Failed",
            description:
              "Please try again. If the issue persists, contact support.",
          });
        } else {
          // Generic error handling for other invoice creation errors
          toast({
            title: "Invoice Creation Failed",
            description: "An unexpected error occurred. Please try again.",
          });
        }
      },
    }),
  );

  // Only watch the fields that are used in the upsert action
  const formValues = useWatch({
    control: form.control,
    name: [
      "customerDetails",
      "customerId",
      "customerName",
      "template",
      "lineItems",
      "amount",
      "vat",
      "tax",
      "discount",
      "dueDate",
      "issueDate",
      "noteDetails",
      "paymentDetails",
      "fromDetails",
      "invoiceNumber",
      "topBlock",
      "bottomBlock",
      "scheduledAt",
      "recurringConfig",
      "invoiceRecurringId",
    ],
  });

  const invoiceNumberValid = !form.getFieldState("invoiceNumber").error;
  const [debouncedValue] = useDebounceValue(formValues, 500);

  // Auto-save: only save when form values have genuinely changed from what was loaded/last saved.
  // Uses a zustand snapshot store instead of isDirty (which is unreliable with computed fields).
  //
  // After each form.reset(), the store is marked as uninitialized. The first debounce tick
  // captures the fully hydrated state (after Summary and other child effects have settled)
  // as the baseline. Subsequent ticks compare against that baseline.
  useEffect(() => {
    const currentFormValues = form.getValues();
    const store = useInvoiceEditorStore.getState();

    // First debounce after a reset: capture the settled values as baseline, don't save
    if (!store.initialized) {
      store.initialize(currentFormValues);
      return;
    }

    if (!store.hasChanged(currentFormValues)) return;
    if (!currentFormValues.customerId || !invoiceNumberValid) return;

    // Serialize now — getValues() returns a shallow copy so nested objects
    // (e.g. template) are shared mutable refs into the form's internal state.
    // If the user edits a field between mutation start and onSuccess,
    // JSON.stringify would capture the unsaved mutation, causing the next
    // hasChanged() check to silently skip the save.
    const serialized = JSON.stringify(currentFormValues);

    draftInvoiceMutation.mutate(transformFormValuesToDraft(currentFormValues), {
      onSuccess: () => {
        store.setSnapshot(serialized);
      },
    });
  }, [debouncedValue, invoiceNumberValid]);

  // Submit the form and the draft invoice
  const handleSubmit = async (values: InvoiceFormValues) => {
    const deliveryType = values.template.deliveryType;
    createInvoiceMutation.mutate({
      id: values.id,
      deliveryType:
        deliveryType === "recurring" ? "create" : (deliveryType ?? "create"),
      scheduledAt: values.scheduledAt || undefined,
    });
  };

  // Prevent form from submitting when pressing enter, but allow newlines in textareas
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="relative flex min-h-0 flex-1 flex-col"
      onKeyDown={handleKeyDown}
    >
      <ScrollArea
        className="min-h-0 flex-1 p-6 [&>div>div]:h-full"
        hideScrollbar
      >
        <div className="p-8 pb-4 h-full flex flex-col bg-[#fcfcfc] dark:bg-[#0f0f0f]">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 mr-5">
              <Meta />
            </div>
            <div className="flex-shrink-0">
              <Logo />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8 mb-4">
            <div>
              <FromDetails />
            </div>
            <div>
              <CustomerDetails />
            </div>
          </div>

          <EditBlock name="topBlock" />

          <div className="mt-4">
            <LineItems />
          </div>

          <div className="mt-12 flex justify-end mb-8">
            <Summary />
          </div>

          <div className="flex flex-col mt-auto">
            <div className="grid grid-cols-2 gap-6 mb-4 overflow-hidden">
              <PaymentDetails />
              <NoteDetails />
            </div>

            <EditBlock name="bottomBlock" />
          </div>
        </div>

        <SavingBar
          isPending={draftInvoiceMutation.isPending}
          isError={draftInvoiceMutation.isError}
        />
      </ScrollArea>

      <div className="absolute bottom-4 w-full border-t border-border pt-4 px-6">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <SettingsMenu />
              <TemplateSelector />
            </div>

            <div className="flex gap-2">
              <TooltipProvider delayDuration={100}>
                {deliveryType === "create_and_send" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={() => setParams({ emailPreview: true })}
                      >
                        <Icons.ForwardToInbox className="size-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      sideOffset={8}
                      className="text-[10px] px-2 py-1"
                    >
                      Preview email
                    </TooltipContent>
                  </Tooltip>
                )}

                {token && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={() => {
                          window.open(`${getUrl()}/i/${token}`, "_blank");
                        }}
                      >
                        <Icons.ExternalLink className="size-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      sideOffset={8}
                      className="text-[10px] px-2 py-1"
                    >
                      Preview invoice
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>

              <SubmitButton
                isSubmitting={
                  createInvoiceMutation.isPending
                }
                disabled={
                  createInvoiceMutation.isPending ||
                  draftInvoiceMutation.isPending
                }
                className={
                  draftInvoiceMutation.isPending
                    ? "disabled:opacity-100 disabled:cursor-wait"
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      </div>
      <EmailPreview />
    </form>
  );
}
