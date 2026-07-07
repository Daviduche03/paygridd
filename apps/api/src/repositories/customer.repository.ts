import { and, asc, desc, eq, ilike, lt, or, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { customers } from "@/db/schema";

type ListCustomersParams = {
  businessId: string;
  pageSize?: number;
  cursor?: string | null;
  q?: string | null;
  sort?: string[] | null;
};

type UpsertCustomerParams = {
  businessId: string;
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  billingEmail?: string | null;
  country?: string | null;
  countryCode?: string | null;
};

function mapListRow(row: {
  id: string;
  name: string;
  email: string | null;
  billingEmail: string | null;
  phone: string | null;
  country: string | null;
  countryCode: string | null;
  createdAt: string;
  businessId: string;
  invoiceCount: number;
}) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    billingEmail: row.billingEmail,
    phone: row.phone,
    country: row.country,
    countryCode: row.countryCode,
    createdAt: row.createdAt,
    businessId: row.businessId,
    invoiceCount: row.invoiceCount,
  };
}

export const customerRepository = {
  async list({
    businessId,
    pageSize = 25,
    cursor,
    q,
    sort,
  }: ListCustomersParams) {
    const conditions = [eq(customers.businessId, businessId)];

    if (q) {
      conditions.push(
        or(ilike(customers.name, `%${q}%`), ilike(customers.email, `%${q}%`))!,
      );
    }

    if (cursor) {
      conditions.push(lt(customers.id, cursor));
    }

    const orderBy = sort?.includes("created_at:asc")
      ? asc(customers.createdAt)
      : desc(customers.createdAt);

    const rows = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        billingEmail: customers.billingEmail,
        phone: customers.phone,
        country: customers.country,
        countryCode: customers.countryCode,
        createdAt: customers.createdAt,
        businessId: customers.businessId,
        invoiceCount: sql<number>`coalesce((
          select count(*)::int
          from invoices i
          where i.customer_id = ${customers.id}
        ), 0)`,
      })
      .from(customers)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(pageSize + 1);

    const hasMore = rows.length > pageSize;
    const slice = hasMore ? rows.slice(0, pageSize) : rows;
    const data = slice.map(mapListRow);
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return {
      data,
      meta: { cursor: nextCursor },
    };
  },

  async findById(businessId: string, id: string) {
    const [row] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.businessId, businessId), eq(customers.id, id)))
      .limit(1);

    return row ?? null;
  },

  async upsert(params: UpsertCustomerParams) {
    if (params.id) {
      const [updated] = await db
        .update(customers)
        .set({
          name: params.name,
          email: params.email ?? null,
          phone: params.phone ?? null,
          billingEmail: params.billingEmail ?? null,
          country: params.country ?? null,
          countryCode: params.countryCode ?? null,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(customers.id, params.id),
            eq(customers.businessId, params.businessId),
          ),
        )
        .returning();

      if (!updated) return null;
      return this.findById(params.businessId, updated.id);
    }

    if (params.email) {
      const [existing] = await db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.businessId, params.businessId),
            eq(customers.email, params.email),
          ),
        )
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(customers)
          .set({
            name: params.name,
            phone: params.phone ?? null,
            billingEmail: params.billingEmail ?? null,
            country: params.country ?? null,
            countryCode: params.countryCode ?? null,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(customers.id, existing.id))
          .returning();

        if (!updated) return null;
        return this.findById(params.businessId, updated.id);
      }
    }

    const [created] = await db
      .insert(customers)
      .values({
        businessId: params.businessId,
        name: params.name,
        email: params.email ?? null,
        phone: params.phone ?? null,
        billingEmail: params.billingEmail ?? null,
        country: params.country ?? null,
        countryCode: params.countryCode ?? null,
      })
      .returning();

    if (!created) return null;
    return this.findById(params.businessId, created.id);
  },

  async delete(businessId: string, id: string) {
    const [deleted] = await db
      .delete(customers)
      .where(and(eq(customers.businessId, businessId), eq(customers.id, id)))
      .returning({ id: customers.id });

    return deleted ?? null;
  },

  async countByBusiness(businessId: string) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(eq(customers.businessId, businessId));

    return row?.count ?? 0;
  },
};
