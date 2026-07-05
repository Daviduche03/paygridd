"use client";

import { ConnectTransactionsModal } from "@/components/modals/connect-transactions-modal";
import { AppDetailSheet } from "@/components/sheets/app-detail-sheet";
import { CategoryCreateSheet } from "@/components/sheets/category-create-sheet";
import { CustomerCreateSheet } from "@/components/sheets/customer-create-sheet";
import { CustomerDetailsSheet } from "@/components/sheets/customer-details-sheet";
import { CustomerEditSheet } from "@/components/sheets/customer-edit-sheet";
import { DocumentSheet } from "@/components/sheets/document-sheet";
import { EditRecurringSheet } from "@/components/sheets/edit-recurring-sheet";
import { InvoiceDetailsSheet } from "@/components/sheets/invoice-details-sheet";
import { InvoiceSheet } from "@/components/sheets/invoice-sheet";
import { ProductCreateSheet } from "@/components/sheets/product-create-sheet";
import { ProductEditSheet } from "@/components/sheets/product-edit-sheet";
import { TransactionCreateSheet } from "@/components/sheets/transaction-create-sheet";
import { TransactionEditSheet } from "@/components/sheets/transaction-edit-sheet";
import { TransactionSheet } from "@/components/sheets/transaction-sheet";

export function GlobalSheets() {
  return (
    <>
      <CategoryCreateSheet />

      <CustomerCreateSheet />
      <CustomerDetailsSheet />
      <CustomerEditSheet />

      <ProductCreateSheet />
      <ProductEditSheet />

      <TransactionSheet />
      <TransactionCreateSheet />
      <TransactionEditSheet />

      <DocumentSheet />

      <ConnectTransactionsModal />

      <InvoiceDetailsSheet />
      <InvoiceSheet />
      <EditRecurringSheet />

      <AppDetailSheet />
    </>
  );
}
