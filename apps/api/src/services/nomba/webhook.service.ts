import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { env } from "@/config/env";
import { transactionRepository } from "@/repositories/transaction.repository";
import { virtualAccountRepository } from "@/repositories/virtual-account.repository";
import { webhookEventRepository } from "@/repositories/webhook-event.repository";
import { reconciliationService } from "@/services/reconciliation.service";
import type {
  NombaWebhookHeaders,
  NombaWebhookPayload,
  StoredNombaWebhookEvent,
} from "@/types/nomba-webhook";

function buildHashingPayload(payload: NombaWebhookPayload, timestamp: string): string {
  const merchant = payload.data?.merchant;
  const transaction = payload.data?.transaction;

  let responseCode = transaction?.responseCode ?? "";
  if (responseCode === "null") {
    responseCode = "";
  }

  return [
    payload.event_type,
    payload.requestId,
    merchant?.userId ?? "",
    merchant?.walletId ?? "",
    transaction?.transactionId ?? "",
    transaction?.type ?? "",
    transaction?.time ?? "",
    responseCode,
    timestamp,
  ].join(":");
}

function generateSignature(payload: NombaWebhookPayload, secret: string, timestamp: string): string {
  const hashingPayload = buildHashingPayload(payload, timestamp);
  return createHmac("sha256", secret).update(hashingPayload).digest("base64");
}

function signaturesMatch(expected: string, actual: string): boolean {
  const a = Buffer.from(expected.toLowerCase());
  const b = Buffer.from(actual.toLowerCase());
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

function mapEventStatus(eventType: string): StoredNombaWebhookEvent["status"] {
  if (eventType.endsWith("_failed")) {
    return "processed";
  }
  return "processed";
}

function toStoredEvent(
  payload: NombaWebhookPayload,
  status: StoredNombaWebhookEvent["status"],
): StoredNombaWebhookEvent {
  const transaction = payload.data?.transaction;
  const customer = payload.data?.customer;

  return {
    id: randomUUID(),
    requestId: payload.requestId,
    eventType: payload.event_type,
    transactionId: transaction?.transactionId,
    amount: transaction?.transactionAmount,
    currency: "NGN",
    status,
    senderName: customer?.senderName,
    virtualAccountNumber: transaction?.aliasAccountNumber,
    virtualAccountName: transaction?.aliasAccountName,
    narration: transaction?.narration,
    receivedAt: new Date().toISOString(),
    payload,
  };
}

function resolveOccurredAt(time?: string) {
  if (time) {
    const parsed = new Date(time);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return new Date().toISOString();
}

async function persistToDatabase(payload: NombaWebhookPayload) {
  const transaction = payload.data?.transaction;
  const customer = payload.data?.customer;
  if (!transaction) return null;

  const identifiers = [transaction.aliasAccountNumber, transaction.aliasAccountReference].filter(
    Boolean,
  ) as string[];

  let account = null;
  for (const identifier of identifiers) {
    account = await virtualAccountRepository.findByIdentifier(identifier);
    if (account) break;
  }

  if (!account) return null;

  const isSuccess = payload.event_type.includes("success");
  const nombaTransactionId = transaction.transactionId ?? payload.requestId;

  const created = await transactionRepository.createFromWebhook({
    businessId: account.businessId,
    virtualAccountId: account.id,
    customerId: account.customerId,
    nombaTransactionId,
    nombaRequestId: payload.requestId,
    eventType: payload.event_type,
    type: "credit",
    amount: transaction.transactionAmount ?? 0,
    currency: "NGN",
    status: isSuccess ? "posted" : transaction.type === "debit" ? "failed" : "pending",
    senderName: customer?.senderName ?? transaction.aliasAccountName ?? account.accountName,
    senderBank: customer?.bankName ?? null,
    narration: transaction.narration ?? null,
    occurredAt: resolveOccurredAt(transaction.time),
  });

  if (isSuccess && created?.id && account.id) {
    await reconciliationService.reconcileVirtualAccountPayment({
      businessId: account.businessId,
      virtualAccountId: account.id,
      transactionId: created.id,
      amount: transaction.transactionAmount ?? 0,
    });
  }

  return { businessId: account.businessId, transactionId: created?.id ?? null };
}

export class NombaWebhookError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const nombaWebhookService = {
  verifySignature(payload: NombaWebhookPayload, headers: NombaWebhookHeaders): boolean {
    const secret = env.NOMBA_WEBHOOK_SECRET;
    if (!secret) {
      if (env.NODE_ENV === "development") {
        return true;
      }
      throw new NombaWebhookError("NOMBA_WEBHOOK_SECRET is not configured", 500);
    }

    if (!headers.signature || !headers.timestamp) {
      throw new NombaWebhookError("Missing nomba-signature or nomba-timestamp header", 401);
    }

    if (headers.algorithm && headers.algorithm !== "HmacSHA256") {
      throw new NombaWebhookError(`Unsupported signature algorithm: ${headers.algorithm}`, 401);
    }

    const expected = generateSignature(payload, secret, headers.timestamp);
    return signaturesMatch(headers.signature, expected);
  },

  async processEvent(
    payload: NombaWebhookPayload,
    headers: NombaWebhookHeaders,
  ): Promise<StoredNombaWebhookEvent> {
    if (!payload.requestId || !payload.event_type) {
      throw new NombaWebhookError("Invalid webhook payload", 400);
    }

    const valid = this.verifySignature(payload, headers);
    if (!valid) {
      throw new NombaWebhookError("Invalid webhook signature", 401);
    }

    const alreadyProcessed = await webhookEventRepository.exists(payload.requestId);
    if (alreadyProcessed) {
      return toStoredEvent(payload, "duplicate");
    }

    const stored = toStoredEvent(payload, mapEventStatus(payload.event_type));

    const persistResult = await persistToDatabase(payload);

    await webhookEventRepository.create({
      businessId: persistResult?.businessId ?? null,
      requestId: payload.requestId,
      eventType: payload.event_type,
      payload,
      transactionId: persistResult?.transactionId ?? null,
    });

    return stored;
  },
};
