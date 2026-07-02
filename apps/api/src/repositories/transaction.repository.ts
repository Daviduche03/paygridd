import { and, desc, eq, gte, ilike, lt, or, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { customers, invoices, transactions, virtualAccounts } from "@/db/schema";

type TransactionStatus = "posted" | "pending" | "failed" | "reversed";
type ReconciliationStatus =
  | "pending"
  | "matched"
  | "underpaid"
  | "overpaid"
  | "duplicate"
  | "needs_review";

type ListRecentParams = {
  businessId: string;
  limit?: number;
  offset?: number;
};

type ListParams = {
  businessId: string;
  pageSize?: number;
  cursor?: string | null;
  q?: string | null;
  searchField?: "reference" | "customer" | "account" | "sender" | null;
  status?: TransactionStatus | null;
  type?: "credit" | "debit" | null;
  customerId?: string | null;
  virtualAccountId?: string | null;
  reconciliationStatus?: ReconciliationStatus | null;
  dateFrom?: string | null;
  amountMin?: number | null;
  amountMax?: number | null;
};

type CreateFromWebhookParams = {
  businessId: string;
  virtualAccountId?: string | null;
  customerId?: string | null;
  nombaTransactionId: string;
  nombaRequestId?: string | null;
  eventType?: string | null;
  type?: "credit" | "debit";
  amount: number;
  currency: string;
  status: "posted" | "pending" | "failed" | "reversed";
  reconciliationStatus?: "pending" | "matched" | "underpaid" | "overpaid" | "duplicate" | "needs_review";
  senderName?: string | null;
  senderBank?: string | null;
  narration?: string | null;
  occurredAt: string;
};

export const transactionRepository = {
  async getPageSummary(businessId: string) {
    const [row] = await db
      .select({
        totalCount: sql<number>`count(*)::int`,
        successCount: sql<number>`count(*) filter (where ${transactions.status} = 'posted')::int`,
        pendingReconciliationCount: sql<number>`count(*) filter (where ${transactions.reconciliationStatus} = 'pending' and ${transactions.status} = 'posted')::int`,
        failedReversedCount: sql<number>`count(*) filter (where ${transactions.status} in ('failed', 'reversed'))::int`,
        volumeToday: sql<number>`coalesce(sum(${transactions.amount}::numeric) filter (where ${transactions.status} = 'posted' and ${transactions.type} = 'credit' and ${transactions.occurredAt} >= date_trunc('day', now())), 0)::float`,
        currency: sql<string>`coalesce(max(${transactions.currency}), 'NGN')`,
      })
      .from(transactions)
      .where(eq(transactions.businessId, businessId));

    return {
      totalCount: row?.totalCount ?? 0,
      successCount: row?.successCount ?? 0,
      pendingReconciliationCount: row?.pendingReconciliationCount ?? 0,
      failedReversedCount: row?.failedReversedCount ?? 0,
      volumeToday: row?.volumeToday ?? 0,
      currency: row?.currency ?? "NGN",
    };
  },

  async list({
    businessId,
    pageSize = 50,
    cursor,
    q,
    searchField,
    status,
    type,
    customerId,
    virtualAccountId,
    reconciliationStatus,
    dateFrom,
    amountMin,
    amountMax,
  }: ListParams) {
    const conditions = [eq(transactions.businessId, businessId)];

    if (status) {
      conditions.push(eq(transactions.status, status));
    }

    if (type) {
      conditions.push(eq(transactions.type, type));
    }

    if (customerId) {
      conditions.push(eq(transactions.customerId, customerId));
    }

    if (virtualAccountId) {
      conditions.push(eq(transactions.virtualAccountId, virtualAccountId));
    }

    if (reconciliationStatus) {
      conditions.push(eq(transactions.reconciliationStatus, reconciliationStatus));
    }

    if (dateFrom) {
      conditions.push(gte(transactions.occurredAt, dateFrom));
    }

    if (amountMin != null) {
      conditions.push(sql`${transactions.amount}::numeric >= ${amountMin}`);
    }

    if (amountMax != null) {
      conditions.push(sql`${transactions.amount}::numeric <= ${amountMax}`);
    }

    if (q?.trim()) {
      const term = `%${q.trim()}%`;
      if (searchField === "customer") {
        conditions.push(ilike(customers.name, term));
      } else if (searchField === "account") {
        conditions.push(
          or(
            ilike(virtualAccounts.accountName, term),
            ilike(virtualAccounts.accountNumber, term),
          )!,
        );
      } else if (searchField === "sender") {
        conditions.push(
          or(
            ilike(transactions.senderName, term),
            ilike(transactions.senderBank, term),
          )!,
        );
      } else {
        conditions.push(
          or(
            ilike(transactions.nombaTransactionId, term),
            ilike(transactions.nombaRequestId, term),
            ilike(transactions.narration, term),
            ilike(customers.name, term),
            ilike(virtualAccounts.accountName, term),
            ilike(virtualAccounts.accountNumber, term),
            ilike(transactions.senderName, term),
            ilike(transactions.senderBank, term),
          )!,
        );
      }
    }

    if (cursor) {
      conditions.push(lt(transactions.id, cursor));
    }

    const rows = await db
      .select({
        id: transactions.id,
        reference: transactions.nombaTransactionId,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        reconciliationStatus: transactions.reconciliationStatus,
        type: transactions.type,
        senderName: transactions.senderName,
        senderBank: transactions.senderBank,
        narration: transactions.narration,
        occurredAt: transactions.occurredAt,
        createdAt: transactions.createdAt,
        customerId: transactions.customerId,
        customerName: customers.name,
        virtualAccountId: transactions.virtualAccountId,
        virtualAccountName: virtualAccounts.accountName,
        virtualAccountNumber: virtualAccounts.accountNumber,
        invoiceId: transactions.invoiceId,
        invoiceNumber: invoices.invoiceNumber,
      })
      .from(transactions)
      .leftJoin(customers, eq(transactions.customerId, customers.id))
      .leftJoin(virtualAccounts, eq(transactions.virtualAccountId, virtualAccounts.id))
      .leftJoin(invoices, eq(transactions.invoiceId, invoices.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.occurredAt), desc(transactions.createdAt))
      .limit(pageSize + 1);

    const hasMore = rows.length > pageSize;
    const data = hasMore ? rows.slice(0, pageSize) : rows;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return { data, meta: { cursor: nextCursor } };
  },

  async listRecent({ businessId, limit = 50, offset = 0 }: ListRecentParams) {
    return db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        reconciliationStatus: transactions.reconciliationStatus,
        occurredAt: transactions.occurredAt,
        createdAt: transactions.createdAt,
        senderName: transactions.senderName,
        narration: transactions.narration,
        virtualAccountId: transactions.virtualAccountId,
      })
      .from(transactions)
      .where(eq(transactions.businessId, businessId))
      .orderBy(desc(transactions.occurredAt), desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async countPendingReview(businessId: string) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .where(
        and(
          eq(transactions.businessId, businessId),
          eq(transactions.reconciliationStatus, "pending"),
          eq(transactions.status, "posted"),
        ),
      );

    return row?.count ?? 0;
  },

  async getBusinessBalance(businessId: string) {
    const [row] = await db
      .select({
        totalBalance: sql<number>`coalesce(sum(case when ${transactions.type} = 'credit' and ${transactions.status} = 'posted' then ${transactions.amount}::numeric when ${transactions.type} = 'debit' and ${transactions.status} = 'posted' then -${transactions.amount}::numeric else 0 end), 0)::float`,
        currency: sql<string>`coalesce(max(${transactions.currency}), 'NGN')`,
      })
      .from(transactions)
      .where(eq(transactions.businessId, businessId));

    return {
      totalBalance: row?.totalBalance ?? 0,
      currency: row?.currency ?? "NGN",
    };
  },

  async findByNombaTransactionId(businessId: string, nombaTransactionId: string) {
    const [row] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.businessId, businessId),
          eq(transactions.nombaTransactionId, nombaTransactionId),
        ),
      )
      .limit(1);

    return row ?? null;
  },

  async listByVirtualAccount({
    businessId,
    virtualAccountId,
    limit = 50,
  }: {
    businessId: string;
    virtualAccountId: string;
    limit?: number;
  }) {
    return db
      .select({
        id: transactions.id,
        nombaTransactionId: transactions.nombaTransactionId,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        reconciliationStatus: transactions.reconciliationStatus,
        type: transactions.type,
        senderName: transactions.senderName,
        senderBank: transactions.senderBank,
        narration: transactions.narration,
        occurredAt: transactions.occurredAt,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.businessId, businessId),
          eq(transactions.virtualAccountId, virtualAccountId),
        ),
      )
      .orderBy(desc(transactions.occurredAt), desc(transactions.createdAt))
      .limit(limit);
  },

  async createFromWebhook(params: CreateFromWebhookParams) {
    const existing = await this.findByNombaTransactionId(
      params.businessId,
      params.nombaTransactionId,
    );
    if (existing) {
      return existing;
    }

    const [created] = await db
      .insert(transactions)
      .values({
        businessId: params.businessId,
        virtualAccountId: params.virtualAccountId ?? null,
        customerId: params.customerId ?? null,
        nombaTransactionId: params.nombaTransactionId,
        nombaRequestId: params.nombaRequestId ?? null,
        eventType: params.eventType ?? null,
        type: params.type ?? "credit",
        amount: String(params.amount),
        currency: params.currency,
        status: params.status,
        reconciliationStatus: params.reconciliationStatus ?? "pending",
        senderName: params.senderName ?? null,
        senderBank: params.senderBank ?? null,
        narration: params.narration ?? null,
        occurredAt: params.occurredAt,
      })
      .returning({ id: transactions.id });

    return created;
  },

  async linkToInvoice(
    businessId: string,
    transactionId: string,
    invoiceId: string,
    reconciliationStatus: ReconciliationStatus,
  ) {
    const [updated] = await db
      .update(transactions)
      .set({
        invoiceId,
        reconciliationStatus,
      })
      .where(and(eq(transactions.id, transactionId), eq(transactions.businessId, businessId)))
      .returning({ id: transactions.id });

    return updated ?? null;
  },

  async setReconciliationStatus(
    businessId: string,
    transactionId: string,
    reconciliationStatus: ReconciliationStatus,
  ) {
    const [updated] = await db
      .update(transactions)
      .set({ reconciliationStatus })
      .where(and(eq(transactions.id, transactionId), eq(transactions.businessId, businessId)))
      .returning({ id: transactions.id });

    return updated ?? null;
  },
};
