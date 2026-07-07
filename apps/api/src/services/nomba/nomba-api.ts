import { env } from "@/config/env";
import { nombaCache } from "@/services/nomba/cache";
import type {
  BankTransactionListResults,
  BankTransferRequest,
  BankTransferResponse,
  CreateVirtualAccountRequest,
  CreateVirtualAccountResponse,
  ExpireVirtualAccountResponse,
  FilterTransactionRequest,
  FilterVirtualAccountRequest,
  FilterVirtualAccountResponse,
  IssueTokenResponse,
  NombaApiResponse,
  ParentAccountTransactionResult,
  RefreshTokenResponse,
  RevokeTokenRequest,
  TransactionListResults,
  TransactionRequeryResult,
  UpdateVirtualAccountRequest,
  UpdateVirtualAccountResponse,
  VirtualAccountObject,
  VirtualAccountTransactionListResults,
} from "@/services/nomba/types";

const ACCESS_TOKEN_KEY = "nomba_access_token";
const REFRESH_TOKEN_KEY = "nomba_refresh_token";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string;
  query?: Record<string, string>;
  body?: unknown;
};

export class NombaApi {
  #baseUrl: string;
  #clientId: string;
  #clientSecret: string;
  #accountId: string;

  constructor() {
    this.#clientId = env.NOMBA_CLIENT_ID;
    this.#clientSecret = env.NOMBA_CLIENT_SECRET;
    this.#accountId = env.NOMBA_ACCOUNT_ID;
    this.#baseUrl =
      env.NOMBA_SANDBOX === "true"
        ? "https://sandbox.nomba.com"
        : "https://api.nomba.com";
  }

  async getHealthCheck(): Promise<boolean> {
    try {
      const token = await this.#getAccessToken();
      await this.#request("/v1/accounts/virtual/list", {
        method: "POST",
        token,
        query: { limit: "1" },
        body: { accountName: "", accountRef: "" },
      });
      return true;
    } catch {
      return false;
    }
  }

  async #getAccessToken(): Promise<string> {
    const cached = await nombaCache.get(ACCESS_TOKEN_KEY);
    if (cached) return cached;

    const refreshToken = await nombaCache.get(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      return this.#refresh(refreshToken);
    }

    return this.#issue();
  }

  async #issue(): Promise<string> {
    const response = await this.#request<NombaApiResponse<IssueTokenResponse>>(
      "/v1/auth/token/issue",
      {
        method: "POST",
        body: {
          grant_type: "client_credentials",
          client_id: this.#clientId,
          client_secret: this.#clientSecret,
        },
      },
    );

    return this.#storeTokens(response.data);
  }

  async #refresh(refreshToken: string): Promise<string> {
    const response = await this.#request<
      NombaApiResponse<RefreshTokenResponse>
    >("/v1/auth/token/refresh", {
      method: "POST",
      body: {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      },
    });

    return this.#storeTokens(response.data);
  }

  async #storeTokens(data: IssueTokenResponse): Promise<string> {
    const ttl = this.#getTokenTTL(data.expiresAt);
    await nombaCache.set(ACCESS_TOKEN_KEY, data.access_token, ttl);
    await nombaCache.set(REFRESH_TOKEN_KEY, data.refresh_token, ttl * 2);
    return data.access_token;
  }

  #getTokenTTL(expiresAt: string): number {
    const expires = new Date(expiresAt).getTime();
    const diff = Math.max(0, expires - Date.now());
    return Math.floor(diff / 1000) - 300;
  }

  async revokeToken(params: RevokeTokenRequest): Promise<void> {
    await this.#request<NombaApiResponse<unknown>>("/v1/auth/token/revoke", {
      method: "POST",
      body: {
        clientId: params.clientId,
        access_token: params.access_token,
      },
    });

    await nombaCache.delete(ACCESS_TOKEN_KEY);
    await nombaCache.delete(REFRESH_TOKEN_KEY);
  }

  async createVirtualAccount(
    params: CreateVirtualAccountRequest,
  ): Promise<CreateVirtualAccountResponse> {
    const token = await this.#getAccessToken();
    const response = await this.#request<
      NombaApiResponse<CreateVirtualAccountResponse>
    >("/v1/accounts/virtual", { method: "POST", token, body: params });
    return response.data;
  }

  async createVirtualAccountForSubAccount(
    subAccountId: string,
    params: CreateVirtualAccountRequest,
  ): Promise<CreateVirtualAccountResponse> {
    const token = await this.#getAccessToken();
    const response = await this.#request<
      NombaApiResponse<CreateVirtualAccountResponse>
    >(`/v1/accounts/virtual/${subAccountId}`, {
      method: "POST",
      token,
      body: params,
    });
    return response.data;
  }

  async getVirtualAccount(identifier: string): Promise<VirtualAccountObject> {
    return nombaCache.getOrSet(
      `nomba_virtual_account_${identifier}`,
      1800,
      async () => {
        const token = await this.#getAccessToken();
        const response = await this.#request<
          NombaApiResponse<VirtualAccountObject>
        >(`/v1/accounts/virtual/${identifier}`, { method: "GET", token });
        return response.data;
      },
    );
  }

  async filterVirtualAccounts(
    params: FilterVirtualAccountRequest & { limit?: number; cursor?: string },
  ): Promise<FilterVirtualAccountResponse> {
    const token = await this.#getAccessToken();
    const query: Record<string, string> = {};
    if (params.limit !== undefined) query.limit = String(params.limit);
    if (params.cursor) query.cursor = params.cursor;

    const response = await this.#request<
      NombaApiResponse<FilterVirtualAccountResponse>
    >("/v1/accounts/virtual/list", {
      method: "POST",
      token,
      query,
      body: params,
    });
    return response.data;
  }

  async expireVirtualAccount(
    identifier: string,
  ): Promise<ExpireVirtualAccountResponse> {
    const token = await this.#getAccessToken();
    const response = await this.#request<
      NombaApiResponse<ExpireVirtualAccountResponse>
    >(`/v1/accounts/virtual/${identifier}`, { method: "DELETE", token });
    await nombaCache.delete(`nomba_virtual_account_${identifier}`);
    return response.data;
  }

  async updateVirtualAccount(
    identifier: string,
    params: UpdateVirtualAccountRequest,
  ): Promise<UpdateVirtualAccountResponse> {
    const token = await this.#getAccessToken();
    const response = await this.#request<
      NombaApiResponse<UpdateVirtualAccountResponse>
    >(`/v1/accounts/virtual/${identifier}`, {
      method: "PUT",
      token,
      body: params,
    });
    await nombaCache.delete(`nomba_virtual_account_${identifier}`);
    return response.data;
  }

  async lookupAccount(accountNumber: string, bankCode: string) {
    const token = await this.#getAccessToken();
    const response = await this.#request<
      NombaApiResponse<{ accountNumber: string; accountName: string }>
    >("/v1/transfers/bank/lookup", {
      method: "POST",
      token,
      body: { accountNumber, bankCode },
    });

    if (response.code !== "00") {
      throw new Error(response.description || "Account lookup failed");
    }

    return response.data;
  }

  async transferToBank(params: BankTransferRequest): Promise<{
    code: string;
    description: string;
    data: BankTransferResponse;
  }> {
    const token = await this.#getAccessToken();
    const response = await this.#request<
      NombaApiResponse<BankTransferResponse>
    >("/v1/transfers/bank", { method: "POST", token, body: params });

    if (response.code !== "00" && response.code !== "01") {
      throw new Error(response.description || "Bank transfer failed");
    }

    return {
      code: response.code,
      description: response.description,
      data: response.data,
    };
  }

  async getParentAccountTransactions(params?: {
    limit?: number;
    cursor?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<TransactionListResults> {
    const token = await this.#getAccessToken();
    const query = this.#paginationQuery(params);
    const response = await this.#request<
      NombaApiResponse<TransactionListResults>
    >("/v1/transactions/accounts", { method: "GET", token, query });
    return response.data;
  }

  async filterParentAccountTransactions(
    filterParams: FilterTransactionRequest,
    pagination?: {
      limit?: number;
      cursor?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ): Promise<TransactionListResults> {
    const token = await this.#getAccessToken();
    const response = await this.#request<
      NombaApiResponse<TransactionListResults>
    >("/v1/transactions/accounts", {
      method: "POST",
      token,
      query: this.#paginationQuery(pagination),
      body: filterParams,
    });
    return response.data;
  }

  async getSingleParentAccountTransaction(params: {
    transactionRef?: string;
    merchantTxRef?: string;
    orderReference?: string;
    orderId?: string;
  }): Promise<ParentAccountTransactionResult> {
    const token = await this.#getAccessToken();
    const query: Record<string, string> = {};
    if (params.transactionRef) query.transactionRef = params.transactionRef;
    if (params.merchantTxRef) query.merchantTxRef = params.merchantTxRef;
    if (params.orderReference) query.orderReference = params.orderReference;
    if (params.orderId) query.orderId = params.orderId;

    const response = await this.#request<
      NombaApiResponse<ParentAccountTransactionResult>
    >("/v1/transactions/accounts/single", { method: "GET", token, query });
    return response.data;
  }

  async getSubAccountTransactions(
    subAccountId: string,
    params?: {
      limit?: number;
      cursor?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ): Promise<TransactionListResults> {
    const token = await this.#getAccessToken();
    const response = await this.#request<
      NombaApiResponse<TransactionListResults>
    >(`/v1/transactions/accounts/${subAccountId}`, {
      method: "GET",
      token,
      query: this.#paginationQuery(params),
    });
    return response.data;
  }

  async filterSubAccountTransactions(
    subAccountId: string,
    filterParams: FilterTransactionRequest,
    pagination?: {
      limit?: number;
      cursor?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ): Promise<TransactionListResults> {
    const token = await this.#getAccessToken();
    const response = await this.#request<
      NombaApiResponse<TransactionListResults>
    >(`/v1/transactions/accounts/${subAccountId}`, {
      method: "POST",
      token,
      query: this.#paginationQuery(pagination),
      body: filterParams,
    });
    return response.data;
  }

  async getSingleSubAccountTransaction(
    subAccountId: string,
    params: {
      transactionRef?: string;
      merchantTxRef?: string;
      orderReference?: string;
      orderId?: string;
    },
  ): Promise<ParentAccountTransactionResult> {
    const token = await this.#getAccessToken();
    const query: Record<string, string> = {};
    if (params.transactionRef) query.transactionRef = params.transactionRef;
    if (params.merchantTxRef) query.merchantTxRef = params.merchantTxRef;
    if (params.orderReference) query.orderReference = params.orderReference;
    if (params.orderId) query.orderId = params.orderId;

    const response = await this.#request<
      NombaApiResponse<ParentAccountTransactionResult>
    >(`/v1/transactions/accounts/${subAccountId}/single`, {
      method: "GET",
      token,
      query,
    });
    return response.data;
  }

  async getParentAccountBalance(): Promise<{
    balance: number;
    currency: string;
  } | null> {
    try {
      const txns = await this.getBankTransactions({ limit: 1 });
      const latest = txns.results[0];
      if (latest) {
        return {
          balance: latest.walletBalance,
          currency: latest.currency ?? "NGN",
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async getBankTransactions(params?: {
    limit?: number;
    cursor?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<BankTransactionListResults> {
    const token = await this.#getAccessToken();
    const response = await this.#request<
      NombaApiResponse<BankTransactionListResults>
    >("/v1/transactions/bank", {
      method: "GET",
      token,
      query: this.#paginationQuery(params),
    });
    return response.data;
  }

  async getVirtualAccountTransactions(params: {
    virtualAccount: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<VirtualAccountTransactionListResults> {
    const token = await this.#getAccessToken();
    const query: Record<string, string> = {
      virtual_account: params.virtualAccount,
    };
    if (params.dateFrom) query.dateFrom = params.dateFrom;
    if (params.dateTo) query.dateTo = params.dateTo;

    const response = await this.#request<
      NombaApiResponse<VirtualAccountTransactionListResults>
    >("/v1/transactions/virtual", { method: "GET", token, query });
    return response.data;
  }

  async requeryTransaction(
    sessionId: string,
  ): Promise<TransactionRequeryResult> {
    const token = await this.#getAccessToken();
    const response = await this.#request<
      NombaApiResponse<TransactionRequeryResult>
    >(`/v1/transactions/requery/${sessionId}`, { method: "GET", token });
    return response.data;
  }

  #paginationQuery(params?: {
    limit?: number;
    cursor?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Record<string, string> {
    const query: Record<string, string> = {};
    if (params?.limit !== undefined) query.limit = String(params.limit);
    if (params?.cursor) query.cursor = params.cursor;
    if (params?.dateFrom) query.dateFrom = params.dateFrom;
    if (params?.dateTo) query.dateTo = params.dateTo;
    return query;
  }

  async #request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    if (!this.#clientId || !this.#clientSecret) {
      throw new Error("Nomba credentials not configured");
    }

    const url = new URL(`${this.#baseUrl}${path}`);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        url.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      accountId: this.#accountId,
    };

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const res = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const text = await res.text();
    let json: T | null = null;

    if (text) {
      try {
        json = JSON.parse(text) as T;
      } catch {
        throw new Error(`Nomba API returned invalid JSON (${res.status})`);
      }
    }

    if (!res.ok) {
      const message =
        (json as NombaApiResponse<unknown> | null)?.description ??
        text ??
        `Nomba API error (${res.status})`;
      const error = new Error(message) as Error & {
        status?: number;
        response?: { status?: number; data?: unknown };
      };
      error.status = res.status;
      error.response = { status: res.status, data: json };
      throw error;
    }

    return json as T;
  }
}
