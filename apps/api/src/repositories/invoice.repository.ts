import { and, asc, desc, eq, gte, ilike, inArray, lt, lte, or, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { businesses, customers, invoices, transactions, virtualAccounts } from "@/db/schema";

type InvoiceStatus =
  | "draft"
  | "scheduled"
  | "unpaid"
  | "overdue"
  | "paid"
  | "canceled"
  | "refunded";

type ListParams = {
  businessId: string;
  pageSize?: number;
  cursor?: string | null;
  q?: string | null;
  statuses?: InvoiceStatus[] | null;
  customerIds?: string[] | null;
  dueFilter?: "overdue" | "week" | "month" | null;
  sort?: string[] | null;
};

type UpsertInvoiceParams = {
  businessId: string;
  id?: string;
  customerId?: string | null;
  virtualAccountId?: string | null;
  invoiceNumber: string;
  amount: number;
  amountPaid?: number;
  currency?: string;
  status?: InvoiceStatus;
  issueDate?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  lineItems?: unknown;
};

const lastActivitySql = sql<string | null>`coalesce((
  select max(t.occurred_at)
  from transactions t
  where t.invoice_id = ${invoices.id}
), ${invoices.updatedAt})`;

const invoiceSelect = {
  id: invoices.id,
  businessId: invoices.businessId,
  customerId: invoices.customerId,
  virtualAccountId: invoices.virtualAccountId,
  invoiceNumber: invoices.invoiceNumber,
  amount: invoices.amount,
  amountPaid: invoices.amountPaid,
  currency: invoices.currency,
  status: invoices.status,
  issueDate: invoices.issueDate,
  dueDate: invoices.dueDate,
  paidAt: invoices.paidAt,
  lineItems: invoices.lineItems,
  createdAt: invoices.createdAt,
  updatedAt: invoices.updatedAt,
  customerName: customers.name,
  virtualAccountName: virtualAccounts.accountName,
  virtualAccountNumber: virtualAccounts.accountNumber,
  virtualAccountBankName: virtualAccounts.bankName,
  lastActivityAt: lastActivitySql,
};

function buildDueFilter(dueFilter?: ListParams["dueFilter"]) {
  if (!dueFilter) return null;

  const now = new Date();
  if (dueFilter === "overdue") {
    return and(
      lt(invoices.dueDate, now.toISOString()),
      inArray(invoices.status, ["unpaid", "overdue"]),
    );
  }

  const end = new Date(now);
  if (dueFilter === "week") {
    end.setDate(end.getDate() + 7);
  } else {
    end.setMonth(end.getMonth() + 1);
  }

  return and(
    gte(invoices.dueDate, now.toISOString()),
    lte(invoices.dueDate, end.toISOString()),
    inArray(invoices.status, ["unpaid", "overdue", "scheduled"]),
  );
}

export const invoiceRepository = {
  async getPageSummary(businessId: string) {
    const [row] = await db
      .select({
        totalCount: sql<number>`count(*)::int`,
        paidCount: sql<number>`count(*) filter (where ${invoices.status} = 'paid')::int`,
        unpaidCount: sql<number>`count(*) filter (where ${invoices.status} in ('unpaid', 'scheduled'))::int`,
        overdueCount: sql<number>`count(*) filter (where ${invoices.status} = 'overdue' or (${invoices.status} = 'unpaid' and ${invoices.dueDate} < now()))::int`,
        draftCount: sql<number>`count(*) filter (where ${invoices.status} = 'draft')::int`,
        totalOutstanding: sql<number>`coalesce(sum((${invoices.amount}::numeric - ${invoices.amountPaid}::numeric)) filter (where ${invoices.status} in ('draft', 'scheduled', 'unpaid', 'overdue')), 0)::float`,
        currency: sql<string>`coalesce(max(${invoices.currency}), 'NGN')`,
      })
      .from(invoices)
      .where(eq(invoices.businessId, businessId));

    return {
      totalCount: row?.totalCount ?? 0,
      paidCount: row?.paidCount ?? 0,
      unpaidCount: row?.unpaidCount ?? 0,
      overdueCount: row?.overdueCount ?? 0,
      draftCount: row?.draftCount ?? 0,
      totalOutstanding: row?.totalOutstanding ?? 0,
      currency: row?.currency ?? "NGN",
    };
  },

  async getSummaryByStatuses(businessId: string, statuses: InvoiceStatus[]) {
    const [row] = await db
      .select({
        totalAmount: sql<number>`coalesce(sum(${invoices.amount}::numeric), 0)::float`,
        invoiceCount: sql<number>`count(*)::int`,
        currency: sql<string>`coalesce(max(${invoices.currency}), 'NGN')`,
      })
      .from(invoices)
      .where(and(eq(invoices.businessId, businessId), inArray(invoices.status, statuses)));

    return {
      totalAmount: row?.totalAmount ?? 0,
      invoiceCount: row?.invoiceCount ?? 0,
      currency: row?.currency ?? "NGN",
    };
  },

  async getOpenSummary(businessId: string) {
    const summary = await this.getSummaryByStatuses(businessId, [
      "draft",
      "scheduled",
      "unpaid",
      "overdue",
    ]);

    return {
      count: summary.invoiceCount,
      totalAmount: summary.totalAmount,
      currency: summary.currency,
    };
  },

  async list({
    businessId,
    pageSize = 50,
    cursor,
    q,
    statuses,
    customerIds,
    dueFilter,
  }: ListParams) {
    const conditions = [eq(invoices.businessId, businessId)];

    if (statuses?.length) {
      const hasOverdue = statuses.includes("overdue");
      const otherStatuses = statuses.filter((status) => status !== "overdue") as InvoiceStatus[];

      if (hasOverdue && otherStatuses.length === 0) {
        conditions.push(
          or(
            eq(invoices.status, "overdue"),
            and(
              inArray(invoices.status, ["unpaid", "scheduled"]),
              lt(invoices.dueDate, new Date().toISOString()),
            ),
          )!,
        );
      } else if (hasOverdue) {
        conditions.push(
          or(
            inArray(invoices.status, otherStatuses),
            eq(invoices.status, "overdue"),
            and(
              inArray(invoices.status, ["unpaid", "scheduled"]),
              lt(invoices.dueDate, new Date().toISOString()),
            ),
          )!,
        );
      } else {
        conditions.push(inArray(invoices.status, statuses as InvoiceStatus[]));
      }
    }

    if (customerIds?.length) {
      conditions.push(inArray(invoices.customerId, customerIds));
    }

    const dueCondition = buildDueFilter(dueFilter);
    if (dueCondition) {
      conditions.push(dueCondition);
    }

    if (q?.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(
        or(
          ilike(invoices.invoiceNumber, term),
          ilike(customers.name, term),
          ilike(virtualAccounts.accountName, term),
          ilike(virtualAccounts.accountNumber, term),
        )!,
      );
    }

    if (cursor) {
      conditions.push(lt(invoices.id, cursor));
    }

    const rows = await db
      .select(invoiceSelect)
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(virtualAccounts, eq(invoices.virtualAccountId, virtualAccounts.id))
      .where(and(...conditions))
      .orderBy(desc(invoices.createdAt))
      .limit(pageSize + 1);

    const hasMore = rows.length > pageSize;
    const data = hasMore ? rows.slice(0, pageSize) : rows;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return { data, meta: { cursor: nextCursor } };
  },

  async findById(businessId: string, id: string) {
    const [row] = await db
      .select(invoiceSelect)
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(virtualAccounts, eq(invoices.virtualAccountId, virtualAccounts.id))
      .where(and(eq(invoices.businessId, businessId), eq(invoices.id, id)))
      .limit(1);

    return row ?? null;
  },

  async searchInvoiceNumbers(businessId: string, search?: string | null) {
    const conditions = [eq(invoices.businessId, businessId)];

    if (search?.trim()) {
      conditions.push(eq(invoices.invoiceNumber, search.trim()));
    }

    return db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
      })
      .from(invoices)
      .where(and(...conditions))
      .orderBy(desc(invoices.createdAt))
      .limit(20);
  },

  async listPayments(businessId: string, invoiceId: string) {
    return db
      .select({
        id: transactions.id,
        reference: transactions.nombaTransactionId,
        amount: transactions.amount,
        currency: transactions.currency,
        status: transactions.status,
        occurredAt: transactions.occurredAt,
      })
      .from(transactions)
      .where(and(eq(transactions.businessId, businessId), eq(transactions.invoiceId, invoiceId)))
      .orderBy(desc(transactions.occurredAt))
      .limit(50);
  },

  async findOpenInvoicesByVirtualAccountId(businessId: string, virtualAccountId: string) {
    return db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        amount: invoices.amount,
        amountPaid: invoices.amountPaid,
        status: invoices.status,
        dueDate: invoices.dueDate,
        createdAt: invoices.createdAt,
        customerId: invoices.customerId,
        virtualAccountId: invoices.virtualAccountId,
        currency: invoices.currency,
        issueDate: invoices.issueDate,
        lineItems: invoices.lineItems,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.businessId, businessId),
          eq(invoices.virtualAccountId, virtualAccountId),
          inArray(invoices.status, ["unpaid", "overdue", "scheduled"]),
        ),
      )
      .orderBy(asc(invoices.dueDate), asc(invoices.createdAt));
  },

  async findOpenInvoicesByCustomerId(businessId: string, customerId: string) {
    return db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        amount: invoices.amount,
        amountPaid: invoices.amountPaid,
        status: invoices.status,
        dueDate: invoices.dueDate,
        createdAt: invoices.createdAt,
        customerId: invoices.customerId,
        virtualAccountId: invoices.virtualAccountId,
        currency: invoices.currency,
        issueDate: invoices.issueDate,
        lineItems: invoices.lineItems,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.businessId, businessId),
          eq(invoices.customerId, customerId),
          inArray(invoices.status, ["unpaid", "overdue", "scheduled"]),
        ),
      )
      .orderBy(asc(invoices.dueDate), asc(invoices.createdAt));
  },

  async countOpenByCustomerId(businessId: string, customerId: string) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(
        and(
          eq(invoices.businessId, businessId),
          eq(invoices.customerId, customerId),
          inArray(invoices.status, ["draft", "scheduled", "unpaid", "overdue"]),
        ),
      );

    return row?.count ?? 0;
  },

  async findPublicById(id: string) {
    const [row] = await db
      .select({
        ...invoiceSelect,
        businessName: businesses.name,
        customerEmail: customers.email,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(virtualAccounts, eq(invoices.virtualAccountId, virtualAccounts.id))
      .innerJoin(businesses, eq(invoices.businessId, businesses.id))
      .where(eq(invoices.id, id))
      .limit(1);

    return row ?? null;
  },

  async setVirtualAccount(businessId: string, invoiceId: string, virtualAccountId: string) {
    const [updated] = await db
      .update(invoices)
      .set({
        virtualAccountId,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(invoices.id, invoiceId), eq(invoices.businessId, businessId)))
      .returning({ id: invoices.id });

    return updated ?? null;
  },

  async upsert(params: UpsertInvoiceParams) {
    const values = {
      businessId: params.businessId,
      customerId: params.customerId ?? null,
      virtualAccountId: params.virtualAccountId ?? null,
      invoiceNumber: params.invoiceNumber,
      amount: String(params.amount),
      amountPaid: String(params.amountPaid ?? 0),
      currency: params.currency ?? "NGN",
      status: params.status ?? "draft",
      issueDate: params.issueDate ?? null,
      dueDate: params.dueDate ?? null,
      paidAt: params.paidAt ?? null,
      lineItems: params.lineItems ?? null,
      updatedAt: new Date().toISOString(),
    };

    if (params.id) {
      const [updated] = await db
        .update(invoices)
        .set(values)
        .where(and(eq(invoices.id, params.id), eq(invoices.businessId, params.businessId)))
        .returning();

      if (updated) {
        return updated;
      }
    }

    const [created] = await db
      .insert(invoices)
      .values(params.id ? { ...values, id: params.id } : values)
      .returning();
    return created ?? null;
  },

  async delete(businessId: string, id: string) {
    const [deleted] = await db
      .delete(invoices)
      .where(and(eq(invoices.businessId, businessId), eq(invoices.id, id)))
      .returning({ id: invoices.id });

    return deleted ?? null;
  },
};
