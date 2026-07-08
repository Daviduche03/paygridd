import { ProviderError } from "@/services/nomba/errors";
import { logger } from "@/utils/logger";
import { NombaApi } from "./nomba-api";
import type {
  CreateVirtualAccountRequest,
  CreateVirtualAccountResponse,
  VirtualAccountTransactionListResults,
} from "./types";
import { parseNombaError } from "./utils";

export class NombaProvider {
  #api: NombaApi;

  constructor() {
    this.#api = new NombaApi();
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
}
