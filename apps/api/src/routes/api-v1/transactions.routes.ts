import { eq } from "drizzle-orm";
import { Router } from "express";
import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticateApiKey, requireScope } from "@/middleware/api-key-auth.middleware";
import { transactionRepository } from "@/repositories/transaction.repository";
import { db } from "@/config/db";
import { transactions } from "@/db/schema";

function stripInternalFields<T extends Record<string, unknown>>(tx: T): Omit<T, "nombaTransactionId" | "nombaRequestId" | "eventType"> {
  const { nombaTransactionId: _, nombaRequestId: __, eventType: ___, ...rest } = tx;
  return rest as Omit<T, "nombaTransactionId" | "nombaRequestId" | "eventType">;
}

export const transactionsRoutes = Router();

transactionsRoutes.use(authenticateApiKey);

transactionsRoutes.get(
  "/",
  requireScope("transactions.read"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const {
      cursor, pageSize, q, status, type, customerId,
      virtualAccountId, reconciliationStatus, dateFrom,
      amountMin, amountMax,
    } = req.query as Record<string, string | undefined>;
    const result = await transactionRepository.list({
      businessId,
      cursor: cursor ?? null,
      pageSize: pageSize ? Number(pageSize) : undefined,
      q: q ?? null,
      status: (status ?? null) as any,
      type: (type ?? null) as any,
      customerId: customerId ?? null,
      virtualAccountId: virtualAccountId ?? null,
      reconciliationStatus: (reconciliationStatus ?? null) as any,
      dateFrom: dateFrom ?? null,
      amountMin: amountMin ? Number(amountMin) : undefined,
      amountMax: amountMax ? Number(amountMax) : undefined,
    });
    res.json({ success: true, data: result.data.map(stripInternalFields), meta: result.meta });
  }),
);

transactionsRoutes.get(
  "/:id",
  requireScope("transactions.read"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const id = req.params.id!;
    const [tx] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);
    if (!tx || tx.businessId !== businessId) {
      res.status(404).json({ success: false, error: "Transaction not found" });
      return;
    }
    res.json({ success: true, data: stripInternalFields(tx) });
  }),
);
