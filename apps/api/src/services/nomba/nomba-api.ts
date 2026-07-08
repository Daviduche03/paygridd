import { env } from "@/config/env";
import { nombaCache } from "@/services/nomba/cache";
import type {
  BankTransferRequest,
  BankTransferResponse,
  CreateVirtualAccountRequest,
  CreateVirtualAccountResponse,
  IssueTokenResponse,
  NombaApiResponse,
  RefreshTokenResponse,
  VirtualAccountTransactionListResults,
} from "@/services/nomba/types";

const ACCESS_TOKEN_KEY = "nomba_access_token";
const REFRESH_TOKEN_KEY = "nomba_refresh_token";

type RequestOptions = {
  method?: "GET" | "POST";
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

  async getVirtualAccountTransactions(params: {
    virtualAccount: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<VirtualAccountTransactionListResults> {
    const token = await this.#getAccessToken();
    return this.#request(
      `/v1/transactions/virtual-accounts/${params.virtualAccount}`,
      {
        token,
        query: { dateFrom: params.dateFrom ?? "", dateTo: params.dateTo ?? "" },
      },
    );
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

  async transferToBank(
    params: BankTransferRequest,
    subAccountId?: string,
  ): Promise<{
    code: string;
    description: string;
    data: BankTransferResponse | null;
  }> {
    const token = await this.#getAccessToken();
    const path = subAccountId
      ? `/v2/transfers/bank/${subAccountId}`
      : "/v1/transfers/bank";
    const response = await this.#request<
      NombaApiResponse<BankTransferResponse>
    >(path, { method: "POST", token, body: params });

    return {
      code: response.code,
      description: response.description,
      data: response.data ?? null,
    };
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