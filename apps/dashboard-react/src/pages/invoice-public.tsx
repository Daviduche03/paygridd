import { HtmlTemplate } from "invoice/templates/html";
import type { Invoice } from "invoice/types";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { InvoicePublicSkeleton } from "@/components/invoice-public-skeleton";
import { InvoiceViewWrapper } from "@/components/invoice-view-wrapper";
import { useTRPC } from "@/trpc/client";

function hasAuthToken() {
  return typeof document !== "undefined" && document.cookie.includes("auth-token=");
}

export default function InvoicePublicPage() {
  const { token } = useParams<{ token: string }>();
  const trpc = useTRPC();

  const { data: invoice, isLoading } = useQuery({
    ...trpc.invoice.getInvoiceByToken.queryOptions({ token: token ?? "" }),
    enabled: Boolean(token),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || status === "paid" || status === "canceled" || status === "refunded") {
        return false;
      }
      return 5000;
    },
  });

  if (isLoading) {
    return <InvoicePublicSkeleton />;
  }

  if (!invoice || (invoice.status === "draft" && !hasAuthToken())) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Invoice not found</p>
      </div>
    );
  }

  const width = invoice.template.size === "letter" ? 750 : 595;
  const height = invoice.template.size === "letter" ? 1056 : 842;
  const paymentEnabled = Boolean(invoice.paymentEnabled);
  const virtualAccount = invoice.virtualAccount ?? null;

  return (
    <InvoiceViewWrapper
      token={invoice.token}
      invoiceNumber={invoice.invoiceNumber || "Invoice"}
      paymentEnabled={paymentEnabled}
      paymentMethod="bank_transfer"
      virtualAccount={virtualAccount}
      amount={invoice.amount ?? undefined}
      currency={invoice.currency ?? undefined}
      initialStatus={invoice.status}
      customerName={invoice.customerName || invoice.customer?.name || "Customer"}
      customerWebsite={invoice.customer?.website}
      invoiceWidth={width}
    >
      <div className="pb-24 md:pb-0">
        <div className="border border-border bg-background">
          <HtmlTemplate
            data={invoice as Invoice}
            width={width}
            height={height}
          />
        </div>
      </div>
    </InvoiceViewWrapper>
  );
}
