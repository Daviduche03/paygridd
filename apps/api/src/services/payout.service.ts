import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { env } from "@/config/env";
import { transactions } from "@/db/schema";
import { NombaApi } from "@/services/nomba/nomba-api";
import type { BankTransferRequest } from "@/services/nomba/types";
import { effectiveNetAmountSql } from "@/utils/transaction-amount";

export const payoutService = {
  async getAvailableBalance(businessId: string) {
    const [row] = await db
      .select({
        totalCredits: sql<string>`coalesce(sum(${effectiveNetAmountSql}) filter (where ${transactions.type} = 'credit' and ${transactions.status} = 'posted'), 0)`,
        totalDebits: sql<string>`coalesce(sum(${transactions.amount}::numeric) filter (where ${transactions.type} = 'debit'), 0)`,
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
    const result = await nomba.transferToBank(
      {
        ...params,
        merchantTxRef: params.merchantTxRef ?? randomUUID(),
      },
      env.NOMBA_SUB_ACCOUNT_ID || undefined,
    );

    await db.insert(transactions).values({
      businessId,
      nombaTransactionId: result.data.transactionRef,
      type: "debit",
      amount: amount.toString(),
      netAmount: "0",
      status: result.code === "00" ? "posted" : "pending",
      senderName: result.data.accountName,
      senderBank: result.data.bankName,
      narration: result.data.narration,
      occurredAt: new Date().toISOString(),
    });

    return result;
  },
};