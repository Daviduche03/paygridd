import { env } from "@/config/env";
import { virtualAccountRepository } from "@/repositories/virtual-account.repository";
import { nombaService } from "@/services/nomba/service";
import type { VirtualAccountObject } from "@/services/nomba/types";

type VirtualAccountKind = "static" | "dynamic";

type PersistParams = {
  customerId?: string | null;
  kind: VirtualAccountKind;
  accountRef: string;
  accountName: string;
  expectedAmount?: number;
};

function isSandbox() {
  return env.NOMBA_SANDBOX === "true";
}

function formatNombaExpiryDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function resolveDynamicExpiryDate(dueDate?: string | null) {
  const base = dueDate ? new Date(dueDate) : new Date();
  if (Number.isNaN(base.getTime())) {
    base.setTime(Date.now());
  }
  base.setDate(base.getDate() + 7);
  if (base.getTime() <= Date.now()) {
    base.setDate(base.getDate() + 7);
  }
  return formatNombaExpiryDate(base);
}

async function persistNombaAccount(
  businessId: string,
  nombaAccount: VirtualAccountObject,
  params: PersistParams,
) {
  const existing = await virtualAccountRepository.findByBusinessAndAccountNumber(
    businessId,
    nombaAccount.bankAccountNumber,
  );

  const expectedAmount =
    params.expectedAmount != null ? String(params.expectedAmount) : null;

  if (existing) {
    return virtualAccountRepository.updateRecord(existing.id, {
      customerId: params.customerId ?? null,
      kind: params.kind,
      accountRef: nombaAccount.accountRef,
      accountName: nombaAccount.accountName,
      bankName: nombaAccount.bankName,
      nombaAccountHolderId: nombaAccount.accountHolderId,
      expectedAmount,
      expired: false,
      status: "active",
    });
  }

  return virtualAccountRepository.create({
    businessId,
    customerId: params.customerId ?? null,
    kind: params.kind,
    accountRef: nombaAccount.accountRef,
    accountName: nombaAccount.accountName,
    accountNumber: nombaAccount.bankAccountNumber,
    bankName: nombaAccount.bankName,
    currency: nombaAccount.currency,
    nombaAccountHolderId: nombaAccount.accountHolderId,
    expectedAmount,
  });
}

async function createOnNomba(params: {
  businessId: string;
  customerId?: string | null;
  kind: VirtualAccountKind;
  accountRef: string;
  accountName: string;
  expectedAmount?: number;
  expiryDate?: string;
}) {
  const nombaAccount = await nombaService.provider.createVirtualAccount({
    accountRef: params.accountRef,
    accountName: params.accountName,
    expectedAmount: params.expectedAmount,
    expiryDate: params.expiryDate,
  });

  return persistNombaAccount(params.businessId, nombaAccount, params);
}

export const virtualAccountService = {
  async createStaticForCustomer(params: {
    businessId: string;
    customerId: string;
    customerName: string;
  }) {
    const existing = await virtualAccountRepository.findActiveStaticByCustomer(
      params.businessId,
      params.customerId,
    );
    if (existing) {
      return existing;
    }

    const accountRef = `cust-${params.customerId}`;

    const byRef = await virtualAccountRepository.findByBusinessAndRef(
      params.businessId,
      accountRef,
    );
    if (byRef && !byRef.expired && byRef.kind === "static") {
      return byRef;
    }

    return createOnNomba({
      businessId: params.businessId,
      customerId: params.customerId,
      kind: "static",
      accountRef,
      accountName: params.customerName.replace(/[^a-zA-Z ]/g, ""),
    });
  },

  async createDynamicForInvoice(params: {
    businessId: string;
    customerId?: string | null;
    invoiceId: string;
    invoiceNumber: string;
    customerName: string;
    amount: number;
    dueDate?: string | null;
  }) {
    const accountRef = `inv-${params.invoiceId}`;

    const existing = await virtualAccountRepository.findByBusinessAndRef(
      params.businessId,
      accountRef,
    );
    if (existing && !existing.expired) {
      return existing;
    }

    const rawName = `${params.customerName} ${params.invoiceNumber}`.replace(/[^a-zA-Z ]/g, "").trim();
    const accountName = rawName || params.customerName.replace(/[^a-zA-Z ]/g, "").trim() || "Invoice Payment";
    const expectedAmount = params.amount > 0 ? params.amount : undefined;
    const expiryDate = isSandbox() ? undefined : resolveDynamicExpiryDate(params.dueDate);

    return createOnNomba({
      businessId: params.businessId,
      customerId: params.customerId ?? null,
      kind: "dynamic",
      accountRef,
      accountName,
      expectedAmount,
      expiryDate,
    });
  },

  async create(params: {
    businessId: string;
    customerId?: string | null;
    accountRef: string;
    accountName: string;
    expectedAmount?: number;
  }) {
    if (params.customerId) {
      return this.createStaticForCustomer({
        businessId: params.businessId,
        customerId: params.customerId,
        customerName: params.accountName,
      });
    }

    return createOnNomba({
      businessId: params.businessId,
      customerId: null,
      kind: "static",
      accountRef: params.accountRef,
      accountName: params.accountName,
      expectedAmount: params.expectedAmount,
    });
  },
};
