import { invoiceRepository } from "@/repositories/invoice.repository";
import { transactionRepository } from "@/repositories/transaction.repository";
import { virtualAccountRepository } from "@/repositories/virtual-account.repository";

type ReconciliationStatus =
  | "pending"
  | "matched"
  | "underpaid"
  | "overpaid"
  | "duplicate"
  | "needs_review";

type OpenInvoice = Awaited<
  ReturnType<typeof invoiceRepository.findOpenInvoicesByVirtualAccountId>
>[number];

function toNumber(value: string | number | null | undefined) {
  if (value == null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMinorUnits(value: number) {
  return Math.round(value * 100);
}

function amountsEqual(a: number, b: number) {
  return toMinorUnits(a) === toMinorUnits(b);
}

function remainingDue(invoice: OpenInvoice) {
  return Math.max(0, toNumber(invoice.amount) - toNumber(invoice.amountPaid));
}

type MatchDecision =
  | { kind: "exact"; invoice: OpenInvoice }
  | { kind: "single_open"; invoice: OpenInvoice; remaining: number }
  | { kind: "ambiguous"; reason: "duplicate_amount" | "no_exact_match" }
  | { kind: "no_balance" };

function decideMatch(
  openInvoices: OpenInvoice[],
  paymentAmount: number,
): MatchDecision {
  const payable = openInvoices
    .map((invoice) => ({ invoice, remaining: remainingDue(invoice) }))
    .filter(({ remaining }) => remaining > 0);

  if (payable.length === 0) {
    return { kind: "no_balance" };
  }

  const exactMatches = payable.filter(({ remaining }) =>
    amountsEqual(remaining, paymentAmount),
  );

  if (exactMatches.length === 1) {
    return { kind: "exact", invoice: exactMatches[0]!.invoice };
  }

  if (exactMatches.length > 1) {
    return { kind: "ambiguous", reason: "duplicate_amount" };
  }

  if (payable.length === 1) {
    return {
      kind: "single_open",
      invoice: payable[0]!.invoice,
      remaining: payable[0]!.remaining,
    };
  }

  return { kind: "ambiguous", reason: "no_exact_match" };
}

function deriveReconciliationStatus(
  remaining: number,
  paymentAmount: number,
): ReconciliationStatus {
  if (amountsEqual(paymentAmount, remaining)) {
    return "matched";
  }
  if (paymentAmount < remaining) {
    return "underpaid";
  }
  return "overpaid";
}

async function applyPaymentToInvoice(params: {
  businessId: string;
  transactionId: string;
  invoice: OpenInvoice;
  paymentAmount: number;
  remaining: number;
}): Promise<{
  invoiceId: string;
  reconciliationStatus: ReconciliationStatus;
  excess: number;
}> {
  const total = toNumber(params.invoice.amount);
  const reconciliationStatus = deriveReconciliationStatus(
    params.remaining,
    params.paymentAmount,
  );
  const isOverpaid = reconciliationStatus === "overpaid";
  const excess = isOverpaid ? params.paymentAmount - params.remaining : 0;
  const newPaid = isOverpaid ? total : toNumber(params.invoice.amountPaid) + params.paymentAmount;
  const isFullyPaid = newPaid >= total;

  await invoiceRepository.upsert({
    businessId: params.businessId,
    id: params.invoice.id,
    customerId: params.invoice.customerId,
    virtualAccountId: params.invoice.virtualAccountId,
    invoiceNumber: params.invoice.invoiceNumber,
    amount: total,
    amountPaid: newPaid,
    currency: params.invoice.currency,
    status: isFullyPaid
      ? "paid"
      : (params.invoice.status as "unpaid" | "overdue" | "scheduled"),
    issueDate: params.invoice.issueDate,
    dueDate: params.invoice.dueDate,
    lineItems: params.invoice.lineItems,
    paidAt: isFullyPaid ? new Date().toISOString() : null,
  });

  await transactionRepository.linkToInvoice(
    params.businessId,
    params.transactionId,
    params.invoice.id,
    reconciliationStatus,
  );

  return { invoiceId: params.invoice.id, reconciliationStatus, excess };
}

async function reconcileDynamicPayment(params: {
  businessId: string;
  virtualAccountId: string;
  transactionId: string;
  amount: number;
}): Promise<{
  invoiceId: string | null;
  reconciliationStatus?: ReconciliationStatus;
  excess?: number;
}> {
  const openInvoices =
    await invoiceRepository.findOpenInvoicesByVirtualAccountId(
      params.businessId,
      params.virtualAccountId,
    );

  if (openInvoices.length === 0) {
    await transactionRepository.setReconciliationStatus(
      params.businessId,
      params.transactionId,
      "needs_review",
    );
    return null;
  }

  if (openInvoices.length > 1) {
    await transactionRepository.setReconciliationStatus(
      params.businessId,
      params.transactionId,
      "needs_review",
    );
    return null;
  }

  const invoice = openInvoices[0]!;
  const remaining = remainingDue(invoice);

  if (remaining <= 0) {
    await transactionRepository.setReconciliationStatus(
      params.businessId,
      params.transactionId,
      "duplicate",
    );
    return null;
  }

  return applyPaymentToInvoice({
    businessId: params.businessId,
    transactionId: params.transactionId,
    invoice,
    paymentAmount: params.amount,
    remaining,
  });
}

async function reconcileStaticPayment(params: {
  businessId: string;
  virtualAccountId: string;
  customerId: string | null;
  transactionId: string;
  amount: number;
}): Promise<{
  invoiceId: string | null;
  reconciliationStatus?: ReconciliationStatus;
  excess?: number;
}> {
  const openInvoices = params.customerId
    ? await invoiceRepository.findOpenInvoicesByCustomerId(
        params.businessId,
        params.customerId,
      )
    : await invoiceRepository.findOpenInvoicesByVirtualAccountId(
        params.businessId,
        params.virtualAccountId,
      );

  const decision = decideMatch(openInvoices, params.amount);

  if (decision.kind === "no_balance") {
    await transactionRepository.setReconciliationStatus(
      params.businessId,
      params.transactionId,
      openInvoices.length > 0 ? "duplicate" : "needs_review",
    );
    return null;
  }

  if (decision.kind === "ambiguous") {
    await transactionRepository.setReconciliationStatus(
      params.businessId,
      params.transactionId,
      "needs_review",
    );
    return null;
  }

  const invoice = decision.invoice;
  const remaining =
    decision.kind === "exact" ? params.amount : decision.remaining;

  return applyPaymentToInvoice({
    businessId: params.businessId,
    transactionId: params.transactionId,
    invoice,
    paymentAmount: params.amount,
    remaining,
  });
}

export const reconciliationService = {
  async reconcileVirtualAccountPayment(params: {
    businessId: string;
    virtualAccountId: string;
    transactionId: string;
    amount: number;
  }): Promise<{
    invoiceId: string | null;
    reconciliationStatus?: ReconciliationStatus;
    excess?: number;
  }> {
    const account = await virtualAccountRepository.findById(
      params.businessId,
      params.virtualAccountId,
    );

    if (account?.kind === "dynamic") {
      return reconcileDynamicPayment(params);
    }

    return reconcileStaticPayment({
      businessId: params.businessId,
      virtualAccountId: params.virtualAccountId,
      customerId: account?.customerId ?? null,
      transactionId: params.transactionId,
      amount: params.amount,
    });
  },
};
