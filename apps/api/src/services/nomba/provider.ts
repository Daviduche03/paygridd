import { ProviderError } from "@/services/nomba/errors";
import { logger } from "@/utils/logger";
import { NombaApi } from "./nomba-api";
import type {
  BankTransactionListResults,
  BankTransactionResult,
  CreateVirtualAccountRequest,
  CreateVirtualAccountResponse,
  ExpireVirtualAccountResponse,
  FilterTransactionRequest,
  FilterVirtualAccountRequest,
  FilterVirtualAccountResponse,
  ParentAccountTransactionResult,
  RevokeTokenRequest,
  TransactionListResults,
  TransactionRequeryResult,
  UpdateVirtualAccountRequest,
  UpdateVirtualAccountResponse,
  VirtualAccountObject,
  VirtualAccountTransactionListResults,
  VirtualAccountTransactionResult,
} from "./types";
import { parseNombaError } from "./utils";

export class NombaProvider {
  #api: NombaApi;

  constructor() {
    this.#api = new NombaApi();
  }

  async getHealthCheck() {
    return this.#api.getHealthCheck();
  }

  async createVirtualAccount(
    params: CreateVirtualAccountRequest,
  ): Promise<CreateVirtualAccountResponse> {
    logger.info("createVirtualAccount", {
      accountRef: params.accountRef,
      accountName: params.accountName,
    });

    try {
      return await this.#api.createVirtualAccount(params);
    } catch (error) {
      const parsed = parseNombaError(error);
      if (parsed) {
        throw new ProviderError(parsed);
      }
      throw error;
    }
  }

  async createVirtualAccountForSubAccount(
    subAccountId: string,
    params: CreateVirtualAccountRequest,
  ): Promise<CreateVirtualAccountResponse> {
    logger.info("createVirtualAccountForSubAccount", {
      subAccountId,
      accountRef: params.accountRef,
    });

    try {
      return await this.#api.createVirtualAccountForSubAccount(
        subAccountId,
        params,
      );
    } catch (error) {
      const parsed = parseNombaError(error);
      if (parsed) {
        throw new ProviderError(parsed);
      }
      throw error;
    }
  }

  async getVirtualAccount(identifier: string): Promise<VirtualAccountObject> {
    logger.info("getVirtualAccount", { identifier });

    try {
      return await this.#api.getVirtualAccount(identifier);
    } catch (error) {
      const parsed = parseNombaError(error);
      if (parsed) {
        throw new ProviderError(parsed);
      }
      throw error;
    }
  }

  async filterVirtualAccounts(
    params: FilterVirtualAccountRequest & {
      limit?: number;
      cursor?: string;
    },
  ): Promise<FilterVirtualAccountResponse> {
    logger.info("filterVirtualAccounts", {
      ...params,
    });

    try {
      return await this.#api.filterVirtualAccounts(params);
    } catch (error) {
      const parsed = parseNombaError(error);
      if (parsed) {
        throw new ProviderError(parsed);
      }
      throw error;
    }
  }

  async expireVirtualAccount(
    identifier: string,
  ): Promise<ExpireVirtualAccountResponse> {
    logger.info("expireVirtualAccount", { identifier });

    try {
      return await this.#api.expireVirtualAccount(identifier);
    } catch (error) {
      const parsed = parseNombaError(error);
      if (parsed) {
        throw new ProviderError(parsed);
      }
      throw error;
    }
  }

  async updateVirtualAccount(
    identifier: string,
    params: UpdateVirtualAccountRequest,
  ): Promise<UpdateVirtualAccountResponse> {
    logger.info("updateVirtualAccount", { identifier, ...params });

    try {
      return await this.#api.updateVirtualAccount(identifier, params);
    } catch (error) {
      const parsed = parseNombaError(error);
      if (parsed) {
        throw new ProviderError(parsed);
      }
      throw error;
    }
  }

  // ─── Transaction Methods ────────────────────────────────

  async getTransactions(
    subAccountId?: string,
    params?: {
      limit?: number;
      cursor?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ): Promise<TransactionListResults> {
    logger.info("getTransactions", { subAccountId });

    try {
      return await this.#api.getTransactions(subAccountId, params);
    } catch (error) {
      const parsed = parseNombaError(error);
      if (parsed) throw new ProviderError(parsed);
      throw error;
    }
  }

  async filterTransactions(
    subAccountId: string | undefined,
    filterParams: FilterTransactionRequest,
    pagination?: {
      limit?: number;
      cursor?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ): Promise<TransactionListResults> {
    logger.info("filterTransactions", { subAccountId });

    try {
      return await this.#api.filterTransactions(
        subAccountId,
        filterParams,
        pagination,
      );
    } catch (error) {
      const parsed = parseNombaError(error);
      if (parsed) throw new ProviderError(parsed);
      throw error;
    }
  }

  async getSingleTransaction(
    subAccountId: string | undefined,
    params: {
      transactionRef?: string;
      merchantTxRef?: string;
      orderReference?: string;
      orderId?: string;
    },
  ): Promise<ParentAccountTransactionResult> {
    logger.info("getSingleTransaction", { subAccountId });

    try {
      return await this.#api.getSingleTransaction(subAccountId, params);
    } catch (error) {
      const parsed = parseNombaError(error);
      if (parsed) throw new ProviderError(parsed);
      throw error;
    }
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
    logger.info("getSubAccountTransactions", { subAccountId });

    try {
      return await this.#api.getSubAccountTransactions(subAccountId, params);
    } catch (error) {
      const parsed = parseNombaError(error);
      if (parsed) throw new ProviderError(parsed);
      throw error;
    }
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
    logger.info("filterSubAccountTransactions", { subAccountId });

    try {
      return await this.#api.filterSubAccountTransactions(
        subAccountId,
        filterParams,
        pagination,
      );
    } catch (error) {
      const parsed = parseNombaError(error);
      if (parsed) throw new ProviderError(parsed);
      throw error;
    }
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
    logger.info("getSingleSubAccountTransaction", { subAccountId });

    try {
      return await this.#api.getSingleSubAccountTransaction(
        subAccountId,
        params,
      );
    } catch (error) {
      const parsed = parseNombaError(error);
      if (parsed) throw new ProviderError(parsed);
      throw error;
    }
  }

  async getBankTransactions(params?: {
    limit?: number;
    cursor?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<BankTransactionListResults> {
    logger.info("getBankTransactions");

    try {
      return await this.#api.getBankTransactions(params);
    } catch (error) {
      const parsed = parseNombaError(error);
      if (parsed) throw new ProviderError(parsed);
      throw error;
    }
  }

  async getVirtualAccountTransactions(params: {
    virtualAccount: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<VirtualAccountTransactionListResults> {
    logger.info("getVirtualAccountTransactions", {
      virtualAccount: params.virtualAccount,
    });

    try {
      return await this.#api.getVirtualAccountTransactions(params);
    } catch (error) {
      const parsed = parseNombaError(error);
      if (parsed) throw new ProviderError(parsed);
      throw error;
    }
  }

  async requeryTransaction(
    sessionId: string,
  ): Promise<TransactionRequeryResult> {
    logger.info("requeryTransaction", { sessionId });

    try {
      return await this.#api.requeryTransaction(sessionId);
    } catch (error) {
      const parsed = parseNombaError(error);
      if (parsed) throw new ProviderError(parsed);
      throw error;
    }
  }

  async revokeToken(params: RevokeTokenRequest): Promise<void> {
    logger.info("revokeToken");

    try {
      await this.#api.revokeToken(params);
    } catch (error) {
      const parsed = parseNombaError(error);
      if (parsed) {
        throw new ProviderError(parsed);
      }
      throw error;
    }
  }
}
