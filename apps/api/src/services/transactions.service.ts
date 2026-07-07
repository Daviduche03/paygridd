import { transactionRepository } from "@/repositories/transaction.repository";
import { getBusinessIdForUser } from "@/utils/business";

function toNumber(value: string | number | null | undefined) {
  if (value == null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDisplayDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const time = new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;

  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function mapUiStatus(status: string | null) {
  if (status === "posted") return "success" as const;
  if (status === "failed") return "failed" as const;
  if (status === "reversed") return "reversed" as const;
  return "pending" as const;
}

function mapDbStatus(status: string | null | undefined) {
  if (status === "success") return "posted" as const;
  if (status === "failed") return "failed" as const;
  if (status === "reversed") return "reversed" as const;
  if (status === "pending") return "pending" as const;
  return null;
}

function resolveDateFrom(dateRange?: string | null) {
  if (!dateRange || dateRange === "all") return null;

  const now = new Date();
  const from = new Date(now);

  if (dateRange === "today") {
    from.setHours(0, 0, 0, 0);
    return from.toISOString();
  }

  const days =
    dateRange === "7d"
      ? 7
      : dateRange === "30d"
        ? 30
        : dateRange === "90d"
          ? 90
          : null;
  if (!days) return null;

  from.setDate(from.getDate() - days);
  return from.toISOString();
}

function resolveAmountRange(amountRange?: string | null) {
  if (!amountRange || amountRange === "all") {
    return { amountMin: null, amountMax: null };
  }

  if (amountRange === "0-1000") return { amountMin: 0, amountMax: 1000 };
  if (amountRange === "1000-10000")
    return { amountMin: 1000, amountMax: 10000 };
  if (amountRange === "10000-100000")
    return { amountMin: 10000, amountMax: 100000 };
  if (amountRange === "100000+") return { amountMin: 100000, amountMax: null };

  return { amountMin: null, amountMax: null };
}

function formatVirtualAccountLabel(
  name: string | null | undefined,
  number: string | null | undefined,
) {
  if (name && number) return `${name} (${number})`;
  return name ?? number ?? "-";
}

function formatSender(senderName: string | null, senderBank: string | null) {
  return senderName ?? senderBank ?? "-";
}

export const transactionsService = {
  async reconciliationSummary(userId: string) {
    const businessId = await getBusinessIdForUser(userId);
    if (!businessId) {
      return { pending: 0, matched: 0, discrepancies: 0 };
    }
    return transactionRepository.getReconciliationSummary(businessId);
  },

  async summary(userId: string) {
    const businessId = await getBusinessIdForUser(userId);
    if (!businessId) {
      return {
        totalCount: 0,
        successCount: 0,
        pendingReconciliationCount: 0,
        failedReversedCount: 0,
        volumeToday: 0,
        currency: "NGN",
      };
    }

    return transactionRepository.getPageSummary(businessId);
  },

  async list({
    userId,
    pageSize = 50,
    cursor,
    q,
    searchField,
    status,
    type,
    customerId,
    virtualAccountId,
    reconciliationStatus,
    dateRange,
    amountRange,
  }: {
    userId: string;
    pageSize?: number;
    cursor?: string | null;
    q?: string | null;
    searchField?: "reference" | "customer" | "account" | "sender" | null;
    status?: "success" | "pending" | "failed" | "reversed" | null;
    type?: "credit" | "debit" | null;
    customerId?: string | null;
    virtualAccountId?: string | null;
    reconciliationStatus?:
      | "pending"
      | "matched"
      | "underpaid"
      | "overpaid"
      | "duplicate"
      | "needs_review"
      | null;
    dateRange?: string | null;
    amountRange?: string | null;
  }) {
    const businessId = await getBusinessIdForUser(userId);
    if (!businessId) {
      return { data: [], meta: { cursor: null } };
    }

    const { amountMin, amountMax } = resolveAmountRange(amountRange);
    const result = await transactionRepository.list({
      businessId,
      pageSize,
      cursor,
      q,
      searchField,
      status: mapDbStatus(status ?? undefined),
      type,
      customerId,
      virtualAccountId,
      reconciliationStatus,
      dateFrom: resolveDateFrom(dateRange),
      amountMin,
      amountMax,
    });

    return {
      data: result.data.map((row) => ({
        id: row.id,
        reference: row.reference,
        customerId: row.customerId,
        customer: row.customerName ?? "-",
        virtualAccountId: row.virtualAccountId,
        virtualAccount: formatVirtualAccountLabel(
          row.virtualAccountName,
          row.virtualAccountNumber,
        ),
        sender: formatSender(row.senderName, row.senderBank),
        amount: toNumber(row.amount),
        currency: row.currency,
        type: row.type,
        status: mapUiStatus(row.status),
        reconciliation: row.reconciliationStatus,
        invoiceId: row.invoiceId,
        invoice: row.invoiceNumber ?? "-",
        invoiceAmount:
          row.invoiceAmount != null ? toNumber(row.invoiceAmount) : null,
        invoiceAmountPaid:
          row.invoiceAmountPaid != null
            ? toNumber(row.invoiceAmountPaid)
            : null,
        date: formatDisplayDate(row.occurredAt ?? row.createdAt),
        occurredAt: row.occurredAt,
      })),
      meta: result.meta,
    };
  },

  async listRecent({
    userId,
    limit = 50,
    offset = 0,
  }: {
    userId: string;
    limit?: number;
    offset?: number;
  }) {
    const businessId = await getBusinessIdForUser(userId);
    if (!businessId) {
      return [];
    }

    const rows = await transactionRepository.listRecent({
      businessId,
      limit,
      offset,
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.senderName,
      description: row.narration,
      amount: toNumber(row.amount),
      currency: row.currency,
      status:
        row.status === "posted"
          ? "Success"
          : row.status === "failed" || row.status === "reversed"
            ? "Failed"
            : "Pending",
      date: formatDisplayDate(row.occurredAt ?? row.createdAt),
    }));
  },
};
