"use client";

import { Button } from "ui/button";
import { Icons } from "ui/icons";
import { SheetContent, SheetHeader } from "ui/sheet";
import { useFormContext } from "react-hook-form";
import { Form } from "@/components/invoice/form";
import { InvoiceSuccess } from "@/components/invoice-success";
import { useInvoiceParams } from "@/hooks/use-invoice-params";

function InvoiceSheetToolbar() {
  const { invoiceType, setParams } = useInvoiceParams();
  const { watch } = useFormContext();
  const invoiceNumber = watch("invoiceNumber");

  const title =
    invoiceType === "edit"
      ? invoiceNumber
        ? `Edit ${invoiceNumber}`
        : "Edit Invoice"
      : "Create Invoice";

  return (
    <SheetHeader className="mb-0 flex shrink-0 flex-row items-center justify-between border-b border-border px-6 py-4">
      <h2 className="text-base font-medium">{title}</h2>
      <Button
        size="icon"
        variant="ghost"
        type="button"
        onClick={() => setParams(null)}
        className="size-auto p-0 m-0 hover:bg-transparent"
      >
        <Icons.Close className="size-5" />
      </Button>
    </SheetHeader>
  );
}

export function InvoiceContent() {
  const { invoiceType } = useInvoiceParams();
  const { watch } = useFormContext();
  const templateSize = watch("template.size");

  const size = templateSize === "a4" ? 650 : 740;

  if (invoiceType === "success") {
    return (
      <SheetContent
        title="Invoice created"
        className="bg-white dark:bg-[#080808] transition-[max-width] duration-300 ease-in-out"
      >
        <InvoiceSuccess />
      </SheetContent>
    );
  }

  return (
    <SheetContent
      title={invoiceType === "edit" ? "Edit Invoice" : "Create Invoice"}
      style={{ maxWidth: size }}
      className="bg-white dark:bg-[#080808] transition-[max-width] duration-300 ease-in-out p-0"
    >
      <div className="flex h-full flex-col">
        <InvoiceSheetToolbar />
        <Form />
      </div>
    </SheetContent>
  );
}
