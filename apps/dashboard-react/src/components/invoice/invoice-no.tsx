"use client";

import { cn } from "ui/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTemplateUpdate } from "@/hooks/use-template-update";
import { useTRPC } from "@/trpc/client";
import { Input } from "./input";
import { LabelInput } from "./label-input";

export function InvoiceNo() {
  const {
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext();
  const invoiceNumber = watch("invoiceNumber");
  const invoiceRecordId = watch("id");
  const trpc = useTRPC();
  const { updateTemplate } = useTemplateUpdate();
  const { invoiceType } = useInvoiceParams();

  const { data } = useQuery(
    trpc.invoice.searchInvoiceNumber.queryOptions(
      {
        search: invoiceNumber,
      },
      {
        enabled: invoiceType === "create" && Boolean(invoiceNumber?.trim()),
        gcTime: 0,
      },
    ),
  );

  useEffect(() => {
    if (invoiceType !== "create" || !invoiceNumber?.trim()) {
      clearErrors("invoiceNumber");
      return;
    }

    const duplicate = data?.some(
      (row) =>
        row.invoiceNumber === invoiceNumber &&
        row.id !== invoiceRecordId,
    );

    if (duplicate) {
      setError("invoiceNumber", {
        type: "manual",
        message: "Invoice number already exists",
      });
    } else {
      clearErrors("invoiceNumber");
    }
  }, [data, invoiceNumber, invoiceRecordId, invoiceType, setError, clearErrors]);

  return (
    <div className="flex space-x-1 items-center">
      <div className="flex items-center flex-shrink-0">
        <LabelInput
          name="template.invoiceNoLabel"
          onSave={(value) => {
            updateTemplate({ invoiceNoLabel: value });
          }}
          className="truncate"
        />
        <span className="text-[11px] text-[#878787] flex-shrink-0">:</span>
      </div>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Input
                name="invoiceNumber"
                className={cn(
                  "w-28 flex-shrink p-0 border-none text-[11px] h-4.5 overflow-hidden",
                  errors.invoiceNumber ? "text-red-500" : "",
                )}
              />
            </div>
          </TooltipTrigger>
          {errors.invoiceNumber && (
            <TooltipContent className="text-xs px-3 py-1.5">
              <p>{errors.invoiceNumber.message ?? "Invoice number already exists"}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
