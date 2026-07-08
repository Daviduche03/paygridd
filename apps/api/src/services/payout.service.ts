import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { env } from "@/config/env";
import { transactions } from "@/db/schema";
import { transactionRepository } from "@/repositories/transaction.repository";
import { NombaApi } from "@/services/nomba/nomba-api";
import type { BankTransferRequest } from "@/services/nomba/types";
import {
  isNombaTransferAccepted,
  isNombaTransferFinal,
} from "@/utils/nomba-transfer";
import { effectiveNetAmountSql } from "@/utils/transaction-amount";

export const payoutService = {
  async getAvailableBalance(businessId: string) {
    const [row] = await db
      .select({
        totalCredits: sql<string>`coalesce(sum(${effectiveNetAmountSql}) filter (where ${transactions.type} = 'credit' and ${transactions.status} = 'posted'), 0)`,
        totalDebits: sql<string>`coalesce(sum(${transactions.amount}::numeric) filter (where ${transactions.type} = 'debit' and ${transactions.status} in ('posted', 'pending')), 0)`,
        totalPaidOut: sql<string>`coalesce(sum(${transactions.amount}::numeric) filter (where ${transactions.type} = 'debit' and ${transactions.status} = 'posted'), 0)`,
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
      totalPaidOut: Number(row?.totalPaidOut ?? 0),
      currency: row?.currency ?? "NGN",
    };
  },

  async transfer(businessId: string, params: BankTransferRequest) {
    const merchantTxRef = params.merchantTxRef ?? randomUUID();
    const amount = params.amount;

    const balance = await this.getAvailableBalance(businessId);
    if (amount > balance.available) {
      throw new Error(
        `Insufficient balance. Available: ${balance.currency} ${balance.available.toFixed(2)}, requested: ${amount.toFixed(2)}`,
      );
    }

    const existing = await transactionRepository.findByNombaTransactionId(
      businessId,
      merchantTxRef,
    );
    if (existing) {
      throw new Error("Duplicate payout reference");
    }

    await transactionRepository.createFromWebhook({
      businessId,
      nombaTransactionId: merchantTxRef,
      nombaRequestId: null,
      eventType: "payout_initiated",
      type: "debit",
      amount,
      platformFee: 0,
      netAmount: 0,
      currency: "NGN",
      status: "pending",
      reconciliationStatus: "matched",
      narration: params.narration ?? null,
      occurredAt: new Date().toISOString(),
    });

    const nomba = new NombaApi();
    const subAccountId = env.NOMBA_SUB_ACCOUNT_ID || undefined;

    let result;
    try {
      result = await nomba.transferToBank(
        { ...params, merchantTxRef },
        subAccountId,
      );
    } catch (error) {
      await transactionRepository.updatePayoutByMerchantRef(
        businessId,
        merchantTxRef,
        { status: "failed", eventType: "payout_failed" },
      );
      throw error;
    }

    if (!isNombaTransferAccepted(result)) {
      await transactionRepository.updatePayoutByMerchantRef(
        businessId,
        merchantTxRef,
        { status: "failed", eventType: "payout_failed" },
      );
      throw new Error(result.description || "Bank transfer failed");
    }

    const status = isNombaTransferFinal(result) ? "posted" : "pending";

    await transactionRepository.updatePayoutByMerchantRef(
      businessId,
      merchantTxRef,
      {
        status,
        nombaRequestId: result.data?.transactionRef ?? null,
        senderName: result.data?.accountName ?? params.accountName ?? null,
        senderBank: result.data?.bankName ?? null,
        narration: result.data?.narration ?? params.narration ?? null,
        eventType: status === "posted" ? "payout_success" : "payout_processing",
      },
    );

    return result;
  },
};