import { randomUUID } from "node:crypto";
import type { Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { db } from "@/config/db";
import { transactions } from "@/db/schema";
import {
  authenticateApiKey,
  requireScope,
} from "@/middleware/api-key-auth.middleware";
import { NombaApi } from "@/services/nomba/nomba-api";
import type { AuthenticatedRequest } from "@/types";
import { asyncHandler } from "@/utils/asyncHandler";

const nombaApi = new NombaApi();

const transferSchema = z.object({
  amount: z.number().positive().finite(),
  accountNumber: z.string().min(10).max(10),
  bankCode: z.string().min(3).max(6),
  accountName: z.string().optional(),
  narration: z.string().optional(),
});

export const payoutsRoutes = Router();

payoutsRoutes.use(authenticateApiKey);

payoutsRoutes.post(
  "/",
  requireScope("transactions.write"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const parsed = transferSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.format() });
      return;
    }

    const { amount, accountNumber, bankCode, accountName, narration } =
      parsed.data;

    const result = await nombaApi.transferToBank({
      amount,
      accountNumber,
      bankCode,
      accountName,
      merchantTxRef: randomUUID(),
      narration,
    });

    await db.insert(transactions).values({
      businessId,
      nombaTransactionId: result.data.transactionRef,
      type: "debit",
      amount: amount.toString(),
      status: result.code === "00" ? "posted" : "pending",
      senderName: result.data.accountName,
      senderBank: result.data.bankName,
      narration: result.data.narration,
      occurredAt: new Date().toISOString(),
    });

    res.status(201).json({ success: true, data: result.data });
  }),
);
