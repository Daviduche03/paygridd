import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/config/db";
import { invoices, statements } from "@/db/schema";

type ListParams = {
  businessId: string;
  customerId: string;
  pageSize?: number;
  cursor?: string | null;
};

type GenerateParams = {
  businessId: string;
  customerId: string;
  periodStart: string;
  periodEnd: string;
};

export const statementRepository = {
  async list({ businessId, customerId, pageSize = 20, cursor }: ListParams) {
    const baseConditions = and(
      eq(statements.businessId, businessId),
      eq(statements.customerId, customerId),
    );

    const where = cursor
      ? and(baseConditions, eq(statements.id, cursor))
      : baseConditions;

    const rows = await db
      .select()
      .from(statements)
      .where(where)
      .orderBy(desc(statements.generatedAt))
      .limit(pageSize);

    return rows;
  },

  async generate({
    businessId,
    customerId,
    periodStart,
    periodEnd,
  }: GenerateParams) {
    const invoiceRows = await db
      .select({
        totalAmount: invoices.amount,
        status: invoices.status,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.businessId, businessId),
          eq(invoices.customerId, customerId),
          gte(invoices.issueDate, periodStart),
          lte(invoices.issueDate, periodEnd),
        ),
      );

    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let invoiceCount = 0;

    for (const inv of invoiceRows) {
      const amount = Number(inv.totalAmount) || 0;
      totalInvoiced += amount;
      invoiceCount++;

      if (inv.status === "paid") {
        totalPaid += amount;
      } else {
        totalOutstanding += amount;
      }
    }

    const [statement] = await db
      .insert(statements)
      .values({
        businessId,
        customerId,
        periodStart,
        periodEnd,
        totalInvoiced: totalInvoiced.toString(),
        totalPaid: totalPaid.toString(),
        totalOutstanding: totalOutstanding.toString(),
        invoiceCount,
      })
      .returning();

    return statement;
  },
};
