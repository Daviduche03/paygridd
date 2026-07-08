import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { transactions } from "@/db/schema";
import { NombaApi } from "@/services/nomba/nomba-api";
import type { BankTransferRequest } from "@/services/nomba/types";
import { effectiveNetAmountSql } from "@/utils/transaction-amount";

export const payoutService = {
  async getAvailableBalance(businessId: string) {
    const [row] = await db
      .select({
        totalCredits: sql<string>`coalesce(sum(${effectiveNetAmountSql}) filter (where ${transactions.type} = 'credit' and ${transactions.status} = 'posted'), 0)`,
        totalDebits: sql<string>`coalesce(sum(${transactions.amount}::numeric) filter (where ${transactions.type} = 'debit' and ${transactions.status} = 'posted'), 0)`,
        currency: sql<string>`coalesce(max(${transactions.currency}), 'NGN')`,
      })
      .from(transactions)
      .where(eq(transactions.businessId, businessId));

    const credits = Number(row?.totalCredits ?? 0);
    const debits = Number(row?.totalDebits ?? 0);
    const available = credits - debits;

    return {
      available,
      totalCollected: credits,
      totalPaidOut: debits,
      currency: row?.currency ?? "NGN",
    };
  },

  async transfer(businessId: string, params: BankTransferRequest) {
    const balance = await this.getAvailableBalance(businessId);
    const amount = params.amount;

    if (amount > balance.available) {
      throw new Error(
        `Insufficient balance. Available: ${balance.currency} ${balance.available.toFixed(2)}, requested: ${amount.toFixed(2)}`,
      );
    }

    const nomba = new NombaApi();
    const result = await nomba.transferToBank({
      ...params,
      merchantTxRef: params.merchantTxRef ?? randomUUID(),
    });

    const txRef = result.data?.transactionRef ?? result.description ?? "pending";
    await db.insert(transactions).values({
      businessId,
      nombaTransactionId: txRef,
      type: "debit",
      amount: amount.toString(),
      netAmount: "0",
      status: "posted",
      senderName: result.data?.accountName ?? null,
      senderBank: result.data?.bankName ?? null,
      narration: result.data?.narration ?? params.narration ?? null,
      occurredAt: new Date().toISOString(),
    });

    return result;
  },
};