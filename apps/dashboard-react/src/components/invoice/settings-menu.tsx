"use client";

import { localDateToUTCMidnight } from "invoice/recurring";
import { uniqueCurrencies } from "location/currencies";
import { Button } from "ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Icons } from "ui/icons";
import { Input } from "ui/input";
import { addDays, parseISO } from "date-fns";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { SelectCurrency } from "../select-currency";

const dateFormats = [
  { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
  { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
  { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
  { value: "dd.MM.yyyy", label: "dd.MM.yyyy" },
];

const invoiceSizes = [
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
];

const paymentTermsOptions = [
  { value: 0, label: "Due on Receipt" },
  { value: 7, label: "Net 7" },
  { value: 10, label: "Net 10" },
  { value: 15, label: "Net 15" },
  { value: 30, label: "Net 30" },
  { value: 45, label: "Net 45" },
  { value: 60, label: "Net 60" },
  { value: 90, label: "Net 90" },
];

function isCustomPaymentTerms(days: number | undefined): boolean {
  if (days === undefined || days === null) return false;
  return !paymentTermsOptions.some((opt) => opt.value === days);
}

const invoiceItems = [
  {
    icon: Icons.CropFree,
    label: "Invoice size",
    options: invoiceSizes,
    key: "size",
  },
  {
    icon: Icons.CurrencyOutline,
    label: "Currency",
    options: uniqueCurrencies.map((currency) => ({
      value: currency,
      label: currency,
    })),
    key: "currency",
  },
  {
    icon: Icons.DateFormat,
    label: "Date format",
    options: dateFormats,
    key: "dateFormat",
  },
];

const taxItems = [
  { icon: Icons.Tax, label: "Sales tax", key: "includeTax" },
  { icon: Icons.Vat, label: "VAT", key: "includeVat" },
  { icon: Icons.ListAlt, label: "Line item tax", key: "includeLineItemTax" },
  { icon: Icons.ConfirmationNumber, label: "Discount", key: "includeDiscount" },
  { icon: Icons.Decimals, label: "Decimals", key: "includeDecimals" },
  { icon: Icons.Straighten, label: "Units", key: "includeUnits" },
  { icon: Icons.QrCode, label: "QR code", key: "includeQr" },
];

const emailItems = [
  {
    icon: Icons.AttachEmail,
    label: "Attach PDF",
    hint: null,
    key: "includePdf",
  },
  {
    icon: Icons.ForwardToInbox,
    label: "Send copy",
    hint: "(BCC)",
    key: "sendCopy",
  },
];

export function SettingsMenu() {
  const { watch, setValue } = useFormContext();
  const [customPaymentDays, setCustomPaymentDays] = useState("");

  const paymentTermsDays = watch("template.paymentTermsDays");

  const handlePaymentTermsChange = (days: number) => {
    const currentPaymentTermsDays = watch("template.paymentTermsDays");
    const valueChanged = currentPaymentTermsDays !== days;

    if (valueChanged) {
      setValue("template.paymentTermsDays", days, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    const issueDate = watch("issueDate");
    if (issueDate) {
      const issueDateParsed = parseISO(issueDate);
      const newDueDate = addDays(issueDateParsed, days);
      setValue("dueDate", localDateToUTCMidnight(newDueDate), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const handleCustomPaymentTermsSubmit = () => {
    const days = Number.parseInt(customPaymentDays, 10);
    if (!Number.isNaN(days) && days >= 0 && days <= 365) {
      handlePaymentTermsChange(days);
      setCustomPaymentDays("");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="h-9 w-9 flex items-center justify-center border border-border hover:bg-accent transition-colors"
          >
            <Icons.Settings className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.ReceiptLong className="mr-2 size-4" />
              <span className="text-xs">Invoice</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44">
              {invoiceItems.map((item) => {
                const watchKey = `template.${item.key}`;

                if (item.key === "currency") {
                  return (
                    <DropdownMenuSub key={item.key}>
                      <DropdownMenuSubTrigger>
                        <item.icon className="mr-2 size-4" />
                        <span className="text-xs">{item.label}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="p-0">
                        <SelectCurrency
                          headless
                          className="text-xs"
                          currencies={uniqueCurrencies}
                          value={watch(watchKey)}
                          onChange={(value) => {
                            setValue(watchKey, value, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
                        />
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                }

                return (
                  <DropdownMenuSub key={item.key}>
                    <DropdownMenuSubTrigger>
                      <item.icon className="mr-2 size-4" />
                      <span className="text-xs">{item.label}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="p-0">
                      {item.options.map((option, optionIndex) => (
                        <DropdownMenuCheckboxItem
                          key={optionIndex.toString()}
                          className="text-xs"
                          checked={watch(watchKey) === option.value}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setValue(watchKey, option.value, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }
                          }}
                          onSelect={(event) => event.preventDefault()}
                        >
                          {option.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                );
              })}

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Icons.CalendarMonth className="mr-2 size-4" />
                  <span className="text-xs">Payment terms</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  className="p-0 max-h-[300px] overflow-y-auto"
                  sideOffset={2}
                  alignOffset={-5}
                  collisionPadding={8}
                >
                  {paymentTermsOptions.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      className="text-xs"
                      checked={paymentTermsDays === option.value}
                      onSelect={(event) => {
                        event.preventDefault();
                        handlePaymentTermsChange(option.value);
                      }}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="text-xs">
                      {isCustomPaymentTerms(paymentTermsDays)
                        ? `Custom (${paymentTermsDays} days)`
                        : "Custom"}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="p-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={365}
                          value={customPaymentDays}
                          onChange={(e) => setCustomPaymentDays(e.target.value)}
                          placeholder={String(paymentTermsDays ?? 30)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleCustomPaymentTermsSubmit();
                            }
                            e.stopPropagation();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-16 h-7 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">
                          days
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={handleCustomPaymentTermsSubmit}
                          disabled={
                            !customPaymentDays ||
                            Number.isNaN(Number.parseInt(customPaymentDays, 10))
                          }
                        >
                          Set
                        </Button>
                      </div>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Tax className="mr-2 size-4" />
              <span className="text-xs">Tax & Pricing</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44">
              {taxItems.map((item) => {
                const watchKey = `template.${item.key}`;
                const isChecked = watch(watchKey) === true;
                return (
                  <DropdownMenuCheckboxItem
                    key={item.key}
                    className="text-xs"
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      setValue(watchKey, checked, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    onSelect={(event) => event.preventDefault()}
                  >
                    <item.icon className="mr-2 size-4" />
                    {item.label}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Email className="mr-2 size-4" />
              <span className="text-xs">Email</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              {emailItems.map((item) => {
                const watchKey = `template.${item.key}`;
                const isChecked = watch(watchKey) === true;
                return (
                  <DropdownMenuCheckboxItem
                    key={item.key}
                    className="text-xs"
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      setValue(watchKey, checked, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    onSelect={(event) => event.preventDefault()}
                  >
                    <item.icon className="mr-2 size-4 shrink-0" />
                    <span className="whitespace-nowrap">
                      {item.label}
                      {item.hint && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          {item.hint}
                        </span>
                      )}
                    </span>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
