export type NombaApiError = {
  code: string;
  description: string;
};

export type NombaApiResponse<T> = {
  code: string;
  description: string;
  data: T;
};

export type IssueTokenRequest = {
  grant_type: "client_credentials" | "refresh_token";
  client_id: string;
  client_secret: string;
};

export type IssueTokenResponse = {
  businessId: string;
  access_token: string;
  refresh_token: string;
  expiresAt: string;
};

export type RefreshTokenRequest = {
  grant_type: "refresh_token";
  refresh_token: string;
};

export type RefreshTokenResponse = IssueTokenResponse;

export type RevokeTokenRequest = {
  clientId: string;
  access_token: string;
};

export type CreateVirtualAccountRequest = {
  accountRef: string;
  accountName: string;
  bvn?: string;
  currency?: string;
  expiryDate?: string;
  expectedAmount?: number;
};

export type CreateVirtualAccountResponse = {
  createdAt: string;
  accountHolderId: string;
  accountRef: string;
  bvn: string;
  accountName: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  currency: string;
  callbackUrl: string;
  expired: boolean;
};

export type VirtualAccountObject = {
  createdAt: string;
  accountHolderId: string;
  accountRef: string;
  bvn: string;
  accountName: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  currency: string;
  callbackUrl: string;
  expired: boolean;
};

export type UpdateVirtualAccountRequest = {
  newAccountRef?: string;
  accountName?: string;
  callbackUrl?: string;
  expectedAmount?: string;
};

export type UpdateVirtualAccountResponse = {
  updated: boolean;
};

export type ExpireVirtualAccountResponse = {
  expired: boolean;
};

export type FilterVirtualAccountRequest = {
  accountName?: string;
  accountRef?: string;
  bvn?: string;
  bankAccountNumber?: string;
  dateCreatedFrom?: string;
  dateCreatedTo?: string;
  expired?: boolean;
  resourceAcquired?: boolean;
};

export type FilterVirtualAccountResponse = {
  results: VirtualAccountObject[];
  cursor: string;
};

// ─── Transaction Types ─────────────────────────────────────

export type TransactionStatus =
  | "SUCCESS"
  | "PENDING_BILLING"
  | "REFUND"
  | "CANCELLED"
  | "PAYMENT_FAILED"
  | "REVERSED_BY_VENDOR";

export type TransactionSource =
  | "api"
  | "pos"
  | "web"
  | "android_app"
  | "ios_app";

export type TransactionType =
  | "withdrawal"
  | "purchase"
  | "transfer"
  | "p2p"
  | "online_checkout"
  | "qrt_credit"
  | "qrt_debit";

export type ParentAccountTransactionResult = {
  id: string;
  status: TransactionStatus;
  amount: number;
  fixedCharge: number;
  source: TransactionSource;
  type: TransactionType;
  gatewayMessage: string;
  customerBillerId?: string;
  timeCreated: string;
  posTid?: string;
  terminalId?: string;
  providerTerminalId?: string;
  rrn?: string;
  posSerialNumber?: string;
  posTerminalLabel?: string;
  stan?: string;
  paymentVendorReference?: string;
  userId?: string;
  posRrn?: string;
  merchantTxRef?: string;
};

export type TransactionListResults = {
  results: ParentAccountTransactionResult[];
  cursor: string;
};

export type BankTransactionMetaObject = {
  billerId?: string;
  terminalActionId?: string;
  productId?: string;
  fee?: number;
  type?: string;
  transactionId?: string;
  rrn?: string;
  parentAccountId?: string;
  terminalLabel?: string;
  accountId?: string;
  merchantTxRef?: string;
  transactionAmount?: number;
  mCollectionsId?: string;
};

export type BankTransactionResult = {
  amount: number;
  currency: string;
  meta: BankTransactionMetaObject;
  status: TransactionStatus;
  timeUpdated: string;
  walletBalance: number;
  transactionType: "CREDIT" | "DEBIT";
};

export type BankTransactionListResults = {
  results: BankTransactionResult[];
  cursor: string;
};

export type VirtualAccountTransactionResult = {
  id: string;
  status: string;
  amount: string;
  fixedCharge: string;
  source: string;
  type: string;
  customerBillerId?: string;
  timeCreated: string;
  timeUpdated?: string;
  posTid?: string;
  posSerialNumber?: string;
  walletCurrency?: string;
  walletBalance?: string;
  billingVendorReference?: string;
  paymentVendorReference?: string;
  userId?: string;
  ktaSenderName?: string;
  ktaSenderAccountNumber?: string;
  ktaSenderBankCode?: string;
  recipientAccountNumber?: string;
  recipientAccountType?: string;
  senderName?: string;
  currency?: string;
  bankCode?: string;
  productId?: string;
  isAgentTransaction?: boolean;
  isInternational?: boolean;
  customerCommission?: string;
  recipientAccountName?: string;
  sessionId?: string;
  accountNumber?: string;
  bankName?: string;
  entryType?: string;
  transactionCategory?: string;
  narration?: string;
  receiptTerminalId?: string;
};

export type VirtualAccountTransactionListResults = {
  results: VirtualAccountTransactionResult[];
  cursor: string;
};

export type FilterTransactionRequest = {
  transactionRef?: string;
  status?: string;
  source?: string;
  type?: string;
  terminalId?: string;
  rrn?: string;
  merchantTxRef?: string;
  orderReference?: string;
  orderId?: string;
};

export type TransactionRequeryResult = {
  id: string;
  status: string;
  amount: string;
  fixedCharge: string;
  source: string;
  type: string;
  customerBillerId?: string;
  timeCreated: string;
  walletBalance?: string;
  billingVendorReference?: string;
  paymentVendorReference?: string;
  userId?: string;
  ktaSenderName?: string;
  ktaSenderAccountNumber?: string;
  ktaSenderBankCode?: string;
  recipientAccountNumber?: string;
  recipientAccountType?: string;
  senderName?: string;
  bankCode?: string;
  productId?: string;
  isAgentTransaction?: boolean;
  isInternational?: boolean;
  customerCommission?: number;
  recipientAccountName?: string;
  sessionId?: string;
  accountNumber?: string;
  bankName?: string;
};

// ─── Bank Transfer Types ───────────────────────────────────

export type BankTransferRequest = {
  amount: number;
  accountNumber: string;
  bankCode: string;
  accountName?: string;
  narration?: string;
  merchantTxRef?: string;
};

export type BankTransferResponse = {
  status: string;
  transactionRef: string;
  amount: number;
  fee: number;
  narration: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
};

// ─── Webhook Types ─────────────────────────────────────────

export type NombaWebhookEventType =
  | "payment_success"
  | "payout_success"
  | "payment_failed"
  | "payment_reversal"
  | "payout_failed"
  | "payout_refund";

export type NombaWebhookPayload = {
  event_type: NombaWebhookEventType;
  requestId: string;
  data: {
    merchant: {
      walletId?: string;
      walletBalance?: number;
      userId: string;
    };
    terminal?: Record<string, unknown>;
    transaction: {
      aliasAccountNumber?: string;
      fee?: number;
      sessionId?: string;
      type?: string;
      transactionId: string;
      aliasAccountName?: string;
      responseCode?: string;
      originatingFrom?: string;
      transactionAmount?: number;
      narration?: string;
      time: string;
      aliasAccountReference?: string;
      aliasAccountType?: string;
    };
    customer: {
      bankCode?: string;
      senderName?: string;
      recipientName?: string;
      bankName?: string;
      accountNumber?: string;
      cardPan?: string;
      productId?: string;
    };
  };
};
