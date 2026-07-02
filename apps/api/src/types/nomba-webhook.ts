export type NombaWebhookEventType =
  | "payment_success"
  | "payment_failed"
  | "payment_reversal"
  | "payout_success"
  | "payout_failed"
  | "payout_refund";

export type NombaWebhookPayload = {
  event_type: NombaWebhookEventType | string;
  requestId: string;
  data?: {
    merchant?: {
      walletId?: string;
      walletBalance?: number;
      userId?: string;
    };
    terminal?: Record<string, unknown>;
    transaction?: {
      aliasAccountNumber?: string;
      fee?: number;
      sessionId?: string;
      type?: string;
      transactionId?: string;
      aliasAccountName?: string;
      responseCode?: string;
      originatingFrom?: string;
      transactionAmount?: number;
      merchantTxRef?: string;
      narration?: string;
      time?: string;
      aliasAccountReference?: string;
      aliasAccountType?: string;
    };
    customer?: {
      bankCode?: string;
      senderName?: string;
      recipientName?: string;
      bankName?: string;
      accountNumber?: string;
    };
    order?: Record<string, unknown>;
  };
};

export type NombaWebhookHeaders = {
  signature: string;
  timestamp: string;
  algorithm?: string;
};

export type StoredNombaWebhookEvent = {
  id: string;
  requestId: string;
  eventType: string;
  transactionId?: string;
  amount?: number;
  currency: string;
  status: "processed" | "duplicate" | "ignored";
  senderName?: string;
  virtualAccountNumber?: string;
  virtualAccountName?: string;
  narration?: string;
  receivedAt: string;
  payload: NombaWebhookPayload;
};
