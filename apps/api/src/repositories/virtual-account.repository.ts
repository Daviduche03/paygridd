import { and, desc, eq, ilike, lt, or, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { customers, transactions, virtualAccounts } from "@/db/schema";

type VirtualAccountStatus = "active" | "suspended" | "closed" | "expired";
type VirtualAccountKind = "static" | "dynamic";

type ListParams = {
  businessId: string;
  pageSize?: number;
  cursor?: string | null;
  q?: string | null;
  status?: VirtualAccountStatus | null;
  customerId?: string | null;
};

type CreateVirtualAccountParams = {
  businessId: string;
  customerId?: string | null;
  kind?: VirtualAccountKind;
  accountRef: string;
  accountName: string;
  accountNumber: string;
  bankName?: string | null;
  currency?: string;
  nombaAccountHolderId?: string | null;
  expectedAmount?: string | null;
};

const totalReceivedSql = sql<number>`coalesce((
  select sum(t.amount::numeric)
  from transactions t
  where t.virtual_account_id = ${virtualAccounts.id}
    and t.status = 'posted'
    and t.type = 'credit'
), 0)::float`;

const lastTransactionSql = sql<string | null>`(
  select max(t.occurred_at)
  from transactions t
  where t.virtual_account_id = ${virtualAccounts.id}
)`;

export const virtualAccountRepository = {
  async getBusinessSummary(businessId: string) {
    const [row] = await db
      .select({
        count: sql<number>`count(*)::int`,
        activeCount: sql<number>`count(*) filter (where ${virtualAccounts.status} = 'active' and ${virtualAccounts.expired} = false)::int`,
        currency: sql<string>`coalesce(max(${virtualAccounts.currency}), 'NGN')`,
      })
      .from(virtualAccounts)
      .where(eq(virtualAccounts.businessId, businessId));

    return {
      count: row?.count ?? 0,
      activeCount: row?.activeCount ?? 0,
      currency: row?.currency ?? "NGN",
    };
  },

  async getPageSummary(businessId: string) {
    const [accounts] = await db
      .select({
        totalCount: sql<number>`count(*)::int`,
        activeCount: sql<number>`count(*) filter (where ${virtualAccounts.status} = 'active' and ${virtualAccounts.expired} = false)::int`,
        suspendedCount: sql<number>`count(*) filter (where ${virtualAccounts.status} = 'suspended')::int`,
        currency: sql<string>`coalesce(max(${virtualAccounts.currency}), 'NGN')`,
      })
      .from(virtualAccounts)
      .where(eq(virtualAccounts.businessId, businessId));

    const [inflow] = await db
      .select({
        total: sql<number>`coalesce(sum(${transactions.amount}::numeric), 0)::float`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.businessId, businessId),
          eq(transactions.status, "posted"),
          eq(transactions.type, "credit"),
          sql`${transactions.occurredAt} >= date_trunc('day', now())`,
        ),
      );

    return {
      totalCount: accounts?.totalCount ?? 0,
      activeCount: accounts?.activeCount ?? 0,
      suspendedCount: accounts?.suspendedCount ?? 0,
      inflowToday: inflow?.total ?? 0,
      currency: accounts?.currency ?? "NGN",
    };
  },

  async list({ businessId, pageSize = 50, cursor, q, status, customerId }: ListParams) {
    const conditions = [eq(virtualAccounts.businessId, businessId)];

    if (status) {
      conditions.push(eq(virtualAccounts.status, status));
    }

    if (customerId) {
      conditions.push(eq(virtualAccounts.customerId, customerId));
    }

    if (q) {
      conditions.push(
        or(
          ilike(virtualAccounts.accountName, `%${q}%`),
          ilike(virtualAccounts.accountNumber, `%${q}%`),
          ilike(virtualAccounts.bankName, `%${q}%`),
          ilike(customers.name, `%${q}%`),
        )!,
      );
    }

    if (cursor) {
      conditions.push(lt(virtualAccounts.id, cursor));
    }

    const rows = await db
      .select({
        id: virtualAccounts.id,
        accountName: virtualAccounts.accountName,
        accountNumber: virtualAccounts.accountNumber,
        accountRef: virtualAccounts.accountRef,
        bankName: virtualAccounts.bankName,
        currency: virtualAccounts.currency,
        status: virtualAccounts.status,
        expired: virtualAccounts.expired,
        customerId: virtualAccounts.customerId,
        kind: virtualAccounts.kind,
        customerName: customers.name,
        createdAt: virtualAccounts.createdAt,
        totalReceived: totalReceivedSql,
        lastTransactionAt: lastTransactionSql,
      })
      .from(virtualAccounts)
      .leftJoin(customers, eq(virtualAccounts.customerId, customers.id))
      .where(and(...conditions))
      .orderBy(desc(virtualAccounts.createdAt))
      .limit(pageSize + 1);

    const hasMore = rows.length > pageSize;
    const data = hasMore ? rows.slice(0, pageSize) : rows;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return { data, meta: { cursor: nextCursor } };
  },

  async findById(businessId: string, id: string) {
    const [row] = await db
      .select({
        id: virtualAccounts.id,
        accountName: virtualAccounts.accountName,
        accountNumber: virtualAccounts.accountNumber,
        accountRef: virtualAccounts.accountRef,
        bankName: virtualAccounts.bankName,
        currency: virtualAccounts.currency,
        status: virtualAccounts.status,
        expired: virtualAccounts.expired,
        customerId: virtualAccounts.customerId,
        kind: virtualAccounts.kind,
        customerName: customers.name,
        createdAt: virtualAccounts.createdAt,
        totalReceived: totalReceivedSql,
        lastTransactionAt: lastTransactionSql,
        transactionCount: sql<number>`coalesce((
          select count(*)::int
          from transactions t
          where t.virtual_account_id = ${virtualAccounts.id}
        ), 0)`,
        pendingReconciliationAmount: sql<number>`coalesce((
          select sum(t.amount::numeric)
          from transactions t
          where t.virtual_account_id = ${virtualAccounts.id}
            and t.reconciliation_status = 'pending'
            and t.status = 'posted'
        ), 0)::float`,
        pendingReconciliationCount: sql<number>`coalesce((
          select count(*)::int
          from transactions t
          where t.virtual_account_id = ${virtualAccounts.id}
            and t.reconciliation_status = 'pending'
            and t.status = 'posted'
        ), 0)`,
        lastPaymentAmount: sql<number | null>`(
          select t.amount::float
          from transactions t
          where t.virtual_account_id = ${virtualAccounts.id}
            and t.status = 'posted'
            and t.type = 'credit'
          order by t.occurred_at desc
          limit 1
        )`,
      })
      .from(virtualAccounts)
      .leftJoin(customers, eq(virtualAccounts.customerId, customers.id))
      .where(and(eq(virtualAccounts.businessId, businessId), eq(virtualAccounts.id, id)))
      .limit(1);

    return row ?? null;
  },

  async findByIdentifier(identifier: string) {
    const [row] = await db
      .select()
      .from(virtualAccounts)
      .where(
        or(
          eq(virtualAccounts.accountNumber, identifier),
          eq(virtualAccounts.accountRef, identifier),
        ),
      )
      .limit(1);

    return row ?? null;
  },

  async create(params: CreateVirtualAccountParams) {
    const [created] = await db
      .insert(virtualAccounts)
      .values({
        businessId: params.businessId,
        customerId: params.customerId ?? null,
        kind: params.kind ?? "static",
        accountRef: params.accountRef,
        accountName: params.accountName,
        accountNumber: params.accountNumber,
        bankName: params.bankName ?? null,
        currency: params.currency ?? "NGN",
        nombaAccountHolderId: params.nombaAccountHolderId ?? null,
        expectedAmount: params.expectedAmount ?? null,
      })
      .returning();

    return created;
  },

  async findByBusinessAndRef(businessId: string, accountRef: string) {
    const [row] = await db
      .select()
      .from(virtualAccounts)
      .where(and(eq(virtualAccounts.businessId, businessId), eq(virtualAccounts.accountRef, accountRef)))
      .limit(1);

    return row ?? null;
  },

  async listByBusiness(businessId: string) {
    return db
      .select()
      .from(virtualAccounts)
      .where(eq(virtualAccounts.businessId, businessId))
      .orderBy(desc(virtualAccounts.createdAt));
  },

  async findByBusinessAndAccountNumber(businessId: string, accountNumber: string) {
    const [row] = await db
      .select()
      .from(virtualAccounts)
      .where(
        and(
          eq(virtualAccounts.businessId, businessId),
          eq(virtualAccounts.accountNumber, accountNumber),
        ),
      )
      .limit(1);

    return row ?? null;
  },

  async findActiveStaticByCustomer(businessId: string, customerId: string) {
    const [row] = await db
      .select()
      .from(virtualAccounts)
      .where(
        and(
          eq(virtualAccounts.businessId, businessId),
          eq(virtualAccounts.customerId, customerId),
          eq(virtualAccounts.kind, "static"),
          eq(virtualAccounts.expired, false),
          eq(virtualAccounts.status, "active"),
        ),
      )
      .limit(1);

    return row ?? null;
  },

  async findActiveByCustomer(businessId: string, customerId: string) {
    return this.findActiveStaticByCustomer(businessId, customerId);
  },

  async updateRecord(
    id: string,
    params: {
      customerId?: string | null;
      kind?: VirtualAccountKind;
      accountRef: string;
      accountName: string;
      bankName?: string | null;
      nombaAccountHolderId?: string | null;
      expectedAmount?: string | null;
      expired?: boolean;
      status?: VirtualAccountStatus;
    },
  ) {
    const [updated] = await db
      .update(virtualAccounts)
      .set({
        customerId: params.customerId ?? null,
        kind: params.kind ?? "static",
        accountRef: params.accountRef,
        accountName: params.accountName,
        bankName: params.bankName ?? null,
        nombaAccountHolderId: params.nombaAccountHolderId ?? null,
        expectedAmount: params.expectedAmount ?? null,
        expired: params.expired ?? false,
        status: params.status ?? "active",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(virtualAccounts.id, id))
      .returning();

    return updated ?? null;
  },

  async markExpiredByRef(accountRef: string) {
    const [updated] = await db
      .update(virtualAccounts)
      .set({
        expired: true,
        status: "expired",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(virtualAccounts.accountRef, accountRef))
      .returning({ id: virtualAccounts.id });

    return updated ?? null;
  },

  async markExpiredByAccountNumber(accountNumber: string) {
    const [updated] = await db
      .update(virtualAccounts)
      .set({
        expired: true,
        status: "expired",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(virtualAccounts.accountNumber, accountNumber))
      .returning({ id: virtualAccounts.id });

    return updated ?? null;
  },
};
