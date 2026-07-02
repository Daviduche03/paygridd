import { invoiceRepository } from "@/repositories/invoice.repository";
import { virtualAccountRepository } from "@/repositories/virtual-account.repository";
import { virtualAccountService } from "@/services/virtual-account.service";
import { getBusinessIdForUser } from "@/utils/business";
import { pool } from "@/config/db";

type InvoiceStatus =
  | "draft"
  | "scheduled"
  | "unpaid"
  | "overdue"
  | "paid"
  | "canceled"
  | "refunded";

type LineItem = {
  name?: string;
  description?: string;
  quantity?: number;
  price?: number;
  unitPrice?: number;
  total?: number;
};

type RawInvoiceData = {
  id?: string;
  customerId?: string | null;
  virtualAccountId?: string | null;
  invoiceNumber?: string;
  amount?: number;
  status?: InvoiceStatus;
  issueDate?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  scheduledAt?: string | null;
  lineItems?: LineItem[];
  template?: { currency?: string };
  currency?: string;
};

function toNumber(value: string | number | null | undefined) {
  if (value == null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatLastActivity(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function resolveDisplayStatus(
  status: string,
  dueDate: string | null | undefined,
  amount: number,
  amountPaid: number,
) {
  if (
    (status === "unpaid" || status === "scheduled") &&
    dueDate &&
    new Date(dueDate) < new Date()
  ) {
    return "overdue" as const;
  }

  if (status === "paid" || (amountPaid >= amount && amount > 0)) {
    return "paid" as const;
  }

  return status as InvoiceStatus;
}

function derivePaymentStatus(amount: number, amountPaid: number, status: string) {
  if (status === "paid" || (amount > 0 && amountPaid == amount)) {
    return "matched" as const;
  }
  if (amountPaid > 0 && amountPaid < amount) {
    return "partial" as const;
  }
  if (amountPaid === 0 && status !== "draft") {
    return "pending" as const;
  }
  return "none" as const;
}

function formatVirtualAccountLabel(
  name: string | null | undefined,
  number: string | null | undefined,
) {
  if (name && number) return `${name} (${number})`;
  return name ?? number ?? "-";
}

function normalizeLineItems(lineItems: unknown) {
  if (!Array.isArray(lineItems)) return [];

  return lineItems.map((item) => {
    const row = item as LineItem;
    const quantity = row.quantity ?? 1;
    const unitPrice = row.unitPrice ?? row.price ?? 0;
    const total = row.total ?? quantity * unitPrice;

    return {
      description: row.description ?? row.name ?? "Line item",
      quantity,
      unitPrice,
      total,
    };
  });
}

function calculateAmount(data: RawInvoiceData) {
  if (data.amount != null && Number.isFinite(data.amount)) {
    return data.amount;
  }

  if (!Array.isArray(data.lineItems)) return 0;

  return data.lineItems.reduce((sum, item) => {
    const quantity = item.quantity ?? 1;
    const unitPrice = item.unitPrice ?? item.price ?? 0;
    const total = item.total ?? quantity * unitPrice;
    return sum + total;
  }, 0);
}

function parseInvoiceData(data: RawInvoiceData) {
  return {
    id: data.id,
    customerId: data.customerId ?? null,
    virtualAccountId: data.virtualAccountId ?? null,
    invoiceNumber: data.invoiceNumber?.trim() ?? "",
    amount: calculateAmount(data),
    currency: data.template?.currency ?? data.currency ?? "NGN",
    status: data.status ?? "draft",
    issueDate: data.issueDate ?? null,
    dueDate: data.dueDate ?? null,
    lineItems: data.lineItems ?? [],
  };
}

function mapListRow(row: Awaited<ReturnType<typeof invoiceRepository.list>>["data"][number]) {
  const amount = toNumber(row.amount);
  const amountPaid = toNumber(row.amountPaid);
  const displayStatus = resolveDisplayStatus(row.status, row.dueDate, amount, amountPaid);

  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    customerId: row.customerId,
    customerName: row.customerName,
    customer: row.customerId
      ? {
          id: row.customerId,
          name: row.customerName ?? "Customer",
        }
      : null,
    amount,
    amountPaid,
    currency: row.currency,
    status: displayStatus,
    paymentStatus: derivePaymentStatus(amount, amountPaid, row.status),
    issueDate: formatDate(row.issueDate),
    dueDate: formatDate(row.dueDate),
    virtualAccount: formatVirtualAccountLabel(
      row.virtualAccountName,
      row.virtualAccountNumber,
    ),
    lastActivity: formatLastActivity(row.lastActivityAt ?? row.updatedAt),
    issueDateRaw: row.issueDate,
    dueDateRaw: row.dueDate,
    updatedAt: row.updatedAt,
    template: {
      vatRate: null,
      taxRate: null,
    },
    vat: 0,
    tax: 0,
    scheduledAt: null,
    viewedAt: null,
    sentAt: null,
    sentTo: null,
    internalNote: null,
    invoiceRecurringId: null,
    recurring: null,
    recurringSequence: null,
  };
}

function mapDetailRow(
  row: NonNullable<Awaited<ReturnType<typeof invoiceRepository.findById>>>,
  payments: Awaited<ReturnType<typeof invoiceRepository.listPayments>>,
) {
  const amount = toNumber(row.amount);
  const amountPaid = toNumber(row.amountPaid);
  const displayStatus = resolveDisplayStatus(row.status, row.dueDate, amount, amountPaid);

  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    customerId: row.customerId,
    customerName: row.customerName,
    customer: row.customerId
      ? {
          id: row.customerId,
          name: row.customerName ?? "Customer",
        }
      : null,
    amount,
    amountPaid,
    currency: row.currency,
    status: displayStatus,
    paymentStatus: derivePaymentStatus(amount, amountPaid, row.status),
    issueDate: row.issueDate ?? new Date().toISOString(),
    dueDate: row.dueDate ?? new Date().toISOString(),
    issueDateDisplay: formatDate(row.issueDate),
    dueDateDisplay: formatDate(row.dueDate),
    virtualAccount: formatVirtualAccountLabel(
      row.virtualAccountName,
      row.virtualAccountNumber,
    ),
    virtualAccountId: row.virtualAccountId,
    lastActivity: formatLastActivity(row.lastActivityAt ?? row.updatedAt),
    lineItems: normalizeLineItems(row.lineItems).map((item) => ({
      name: item.description,
      quantity: item.quantity,
      price: item.unitPrice,
    })),
    payments: payments.map((payment) => ({
      reference: payment.reference,
      amount: toNumber(payment.amount),
      currency: payment.currency,
      status: payment.status === "posted" ? "success" : payment.status,
      date: formatLastActivity(payment.occurredAt),
    })),
    template: {
      currency: row.currency,
      customerLabel: "Bill to",
      fromLabel: "From",
      invoiceNoLabel: "Invoice number",
      issueDateLabel: "Issue date",
      dueDateLabel: "Due date",
      descriptionLabel: "Description",
      priceLabel: "Price",
      quantityLabel: "Qty",
      totalLabel: "Total",
      paymentLabel: "Payment details",
      noteLabel: "Note",
      size: "a4" as const,
      dateFormat: "dd/MM/yyyy" as const,
      deliveryType: "create" as const,
      vatRate: null,
      taxRate: null,
    },
    fromDetails: null,
    customerDetails: null,
    paymentDetails: null,
    noteDetails: null,
    token: row.id,
    scheduledAt: null,
    vat: 0,
    tax: 0,
    discount: 0,
    subtotal: amount,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  };
}

async function nextInvoiceNumber(businessId: string) {
  const year = new Date().getFullYear();

  const result = await pool.query<{ last_number: number }>(
    `INSERT INTO invoice_number_sequences (business_id, year, last_number)
     VALUES ($1, $2, 1)
     ON CONFLICT (business_id, year) DO UPDATE
       SET last_number = invoice_number_sequences.last_number + 1
     RETURNING last_number`,
    [businessId, year],
  );

  const num = result.rows[0]?.last_number ?? 1;
  return `INV-${year}-${String(num).padStart(4, "0")}`;
}

function buildTextDoc(lines: string[]) {
  return {
    type: "doc" as const,
    content: lines
      .filter(Boolean)
      .map((text) => ({
        type: "paragraph",
        content: [{ type: "text", text }],
      })),
  };
}

async function ensureVirtualAccountForInvoice(
  businessId: string,
  invoice: {
    id: string;
    customerId: string | null;
    customerName: string | null;
    invoiceNumber: string;
    amount: string | number;
    dueDate?: string | null;
    virtualAccountId: string | null;
  },
) {
  if (invoice.virtualAccountId) {
    const existing = await virtualAccountRepository.findById(
      businessId,
      invoice.virtualAccountId,
    );
    if (existing && !existing.expired && existing.kind === "dynamic") {
      return existing;
    }
  }

  const amount = toNumber(invoice.amount);

  const created = await virtualAccountService.createDynamicForInvoice({
    businessId,
    customerId: invoice.customerId,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName ?? "Customer",
    amount,
    dueDate: invoice.dueDate,
  });

  if (!created?.id) {
    throw new Error("Failed to provision payment account");
  }

  await invoiceRepository.setVirtualAccount(businessId, invoice.id, created.id);
  return created;
}

function mapPublicInvoice(
  row: NonNullable<Awaited<ReturnType<typeof invoiceRepository.findPublicById>>>,
) {
  const amount = toNumber(row.amount);
  const amountPaid = toNumber(row.amountPaid);
  const displayStatus = resolveDisplayStatus(row.status, row.dueDate, amount, amountPaid);
  const lineItems = normalizeLineItems(row.lineItems).map((item) => ({
    name: item.description,
    quantity: item.quantity,
    price: item.unitPrice,
  }));

  const hasVirtualAccount = Boolean(row.virtualAccountNumber);
  const canPay =
    hasVirtualAccount &&
    displayStatus !== "paid" &&
    displayStatus !== "canceled" &&
    displayStatus !== "refunded" &&
    displayStatus !== "draft";

  const paymentLines = hasVirtualAccount
    ? [
        row.virtualAccountBankName ? `Bank: ${row.virtualAccountBankName}` : null,
        row.virtualAccountName ? `Account name: ${row.virtualAccountName}` : null,
        row.virtualAccountNumber ? `Account number: ${row.virtualAccountNumber}` : null,
        `Amount: ${row.currency} ${amount.toLocaleString("en-NG")}`,
        row.invoiceNumber ? `Reference: ${row.invoiceNumber}` : null,
      ].filter((line): line is string => Boolean(line))
    : [];

  const paymentDetails = paymentLines.length > 0 ? buildTextDoc(paymentLines) : null;

  const template = {
    title: "Invoice",
    customerLabel: "Bill to",
    fromLabel: "From",
    invoiceNoLabel: "Invoice number",
    issueDateLabel: "Issue date",
    dueDateLabel: "Due date",
    descriptionLabel: "Description",
    priceLabel: "Price",
    quantityLabel: "Qty",
    totalLabel: "Total",
    totalSummaryLabel: "Total",
    vatLabel: "VAT",
    subtotalLabel: "Subtotal",
    taxLabel: "Tax",
    discountLabel: "Discount",
    paymentLabel: "Payment details",
    noteLabel: "Note",
    logoUrl: null,
    currency: row.currency,
    paymentDetails: null,
    fromDetails: null,
    noteDetails: null,
    timezone: "Africa/Lagos",
    dateFormat: "dd/MM/yyyy" as const,
    includeVat: false,
    includeTax: false,
    includeDiscount: false,
    includeDecimals: false,
    includeUnits: false,
    includeQr: false,
    taxRate: 0,
    vatRate: 0,
    size: "a4" as const,
    deliveryType: "create" as const,
    locale: "en-NG",
    paymentEnabled: canPay,
  };

  return {
    id: row.id,
    token: row.id,
    invoiceNumber: row.invoiceNumber,
    customerName: row.customerName,
    customerId: row.customerId,
    amount,
    amountPaid,
    currency: row.currency,
    status: displayStatus,
    issueDate: row.issueDate,
    dueDate: row.dueDate,
    lineItems,
    vat: 0,
    tax: 0,
    discount: 0,
    template,
    fromDetails: null,
    customerDetails: null,
    paymentDetails,
    noteDetails: null,
    topBlock: null,
    bottomBlock: null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    paidAt: row.paidAt,
    viewedAt: null,
    sentAt: null,
    sentTo: null,
    internalNote: null,
    note: null,
    reminderSentAt: null,
    filePath: null,
    paymentEnabled: canPay,
    virtualAccount: hasVirtualAccount
      ? {
          bankName: row.virtualAccountBankName,
          accountName: row.virtualAccountName,
          accountNumber: row.virtualAccountNumber,
        }
      : null,
    customer: row.customerId
      ? {
          name: row.customerName,
          website: null,
          email: row.customerEmail ?? null,
        }
      : null,
    business: {
      name: row.businessName,
    },
  };
}

export const invoiceService = {
  async summary(userId: string) {
    const businessId = await getBusinessIdForUser(userId);
    if (!businessId) {
      return {
        totalCount: 0,
        paidCount: 0,
        unpaidCount: 0,
        overdueCount: 0,
        draftCount: 0,
        totalOutstanding: 0,
        currency: "NGN",
      };
    }

    return invoiceRepository.getPageSummary(businessId);
  },

  async invoiceSummary(userId: string, statuses?: InvoiceStatus[] | null) {
    const businessId = await getBusinessIdForUser(userId);
    if (!businessId) {
      return {
        totalAmount: 0,
        invoiceCount: 0,
        currency: "NGN",
        breakdown: [],
      };
    }

    const resolvedStatuses =
      statuses && statuses.length > 0
        ? statuses
        : (["draft", "scheduled", "unpaid", "overdue", "paid"] as InvoiceStatus[]);

    const summary = await invoiceRepository.getSummaryByStatuses(
      businessId,
      resolvedStatuses,
    );

    return {
      totalAmount: summary.totalAmount,
      invoiceCount: summary.invoiceCount,
      currency: summary.currency,
      breakdown: [
        {
          currency: summary.currency,
          count: summary.invoiceCount,
          originalAmount: summary.totalAmount,
          convertedAmount: summary.totalAmount,
        },
      ],
    };
  },

  async list({
    userId,
    pageSize = 50,
    cursor,
    q,
    statuses,
    customers,
    start,
    end,
    dueFilter,
  }: {
    userId: string;
    pageSize?: number;
    cursor?: string | null;
    q?: string | null;
    statuses?: string[] | null;
    customers?: string[] | null;
    start?: string | null;
    end?: string | null;
    dueFilter?: "overdue" | "week" | "month" | null;
  }) {
    const businessId = await getBusinessIdForUser(userId);
    if (!businessId) {
      return { data: [], meta: { cursor: null } };
    }

    const result = await invoiceRepository.list({
      businessId,
      pageSize,
      cursor,
      q,
      statuses: statuses as InvoiceStatus[] | null,
      customerIds: customers,
      dueFilter,
    });

    let data = result.data.map(mapListRow);

    if (start || end) {
      data = data.filter((row) => {
        const due = row.dueDateRaw ? new Date(row.dueDateRaw).getTime() : null;
        if (!due) return false;
        if (start && due < new Date(start).getTime()) return false;
        if (end && due > new Date(end).getTime()) return false;
        return true;
      });
    }

    return {
      data,
      meta: result.meta,
    };
  },

  async getById(userId: string, id: string) {
    const businessId = await getBusinessIdForUser(userId);
    if (!businessId) return null;

    const row = await invoiceRepository.findById(businessId, id);
    if (!row) return null;

    const payments = await invoiceRepository.listPayments(businessId, id);
    return mapDetailRow(row, payments);
  },

  async defaultSettings(userId: string) {
    const businessId = await getBusinessIdForUser(userId);
    if (!businessId) return null;

    const id = crypto.randomUUID();
    const invoiceNumber = await nextInvoiceNumber(businessId);
    const now = new Date();
    const due = new Date(now);
    due.setMonth(due.getMonth() + 1);

    return {
      id,
      status: "draft" as const,
      invoiceNumber,
      currency: "NGN",
      amount: 0,
      issueDate: now.toISOString(),
      dueDate: due.toISOString(),
      lineItems: [{ name: "Service", quantity: 1, price: 0 }],
      template: {
        currency: "NGN",
        customerLabel: "Bill to",
        fromLabel: "From",
        invoiceNoLabel: "Invoice number",
        issueDateLabel: "Issue date",
        dueDateLabel: "Due date",
        descriptionLabel: "Description",
        priceLabel: "Price",
        quantityLabel: "Qty",
        totalLabel: "Total",
        paymentLabel: "Payment details",
        noteLabel: "Note",
        size: "a4" as const,
        dateFormat: "dd/MM/yyyy" as const,
        deliveryType: "create" as const,
      },
      fromDetails: null,
      customerDetails: null,
      paymentDetails: null,
      noteDetails: null,
      token: id,
    };
  },

  async searchInvoiceNumber(userId: string, search?: string | null) {
    const businessId = await getBusinessIdForUser(userId);
    if (!businessId) return [];
    return invoiceRepository.searchInvoiceNumbers(businessId, search);
  },

  async getByToken(token: string) {
    const id = decodeURIComponent(token).trim();
    if (!id) return null;

    let row = await invoiceRepository.findPublicById(id);
    if (!row) return null;

    const payableStatuses = ["unpaid", "overdue", "scheduled"];
    if (
      payableStatuses.includes(row.status) &&
      toNumber(row.amount) > 0
    ) {
      try {
        await ensureVirtualAccountForInvoice(row.businessId, {
          id: row.id,
          customerId: row.customerId,
          customerName: row.customerName,
          invoiceNumber: row.invoiceNumber,
          amount: row.amount,
          dueDate: row.dueDate,
          virtualAccountId: row.virtualAccountId,
        });
        row = (await invoiceRepository.findPublicById(id)) ?? row;
      } catch {
        // Payment provisioning failed — invoice still viewable without payment
      }
    }

    return mapPublicInvoice(row);
  },

  async saveDraft(userId: string, data: RawInvoiceData) {
    const businessId = await getBusinessIdForUser(userId);
    if (!businessId) {
      throw new Error("Business required");
    }

    const parsed = parseInvoiceData(data);
    if (!parsed.invoiceNumber) {
      parsed.invoiceNumber = await nextInvoiceNumber(businessId);
    }

    const saved = await invoiceRepository.upsert({
      businessId,
      id: parsed.id,
      customerId: parsed.customerId,
      virtualAccountId: parsed.virtualAccountId,
      invoiceNumber: parsed.invoiceNumber,
      amount: parsed.amount,
      currency: parsed.currency,
      status: "draft",
      issueDate: parsed.issueDate,
      dueDate: parsed.dueDate,
      lineItems: parsed.lineItems,
    });

    if (!saved) {
      throw new Error("Failed to save draft invoice");
    }

    return { id: saved.id };
  },

  async finalizeDraft(
    userId: string,
    input: {
      id: string;
      deliveryType?: string;
      scheduledAt?: string;
    },
  ) {
    const businessId = await getBusinessIdForUser(userId);
    if (!businessId) {
      throw new Error("Business required");
    }

    const existing = await invoiceRepository.findById(businessId, input.id);
    if (!existing) {
      throw new Error("Draft invoice not found");
    }

    const status =
      input.deliveryType === "scheduled" || input.scheduledAt
        ? "scheduled"
        : "unpaid";

    let virtualAccountId = existing.virtualAccountId;

    if (status !== "scheduled" && toNumber(existing.amount) > 0) {
      try {
        const va = await ensureVirtualAccountForInvoice(businessId, {
          id: existing.id,
          customerId: existing.customerId,
          customerName: existing.customerName,
          invoiceNumber: existing.invoiceNumber,
          amount: existing.amount,
          dueDate: existing.dueDate,
          virtualAccountId: existing.virtualAccountId,
        });
        virtualAccountId = va.id;
      } catch {
        // Nomba virtual account provisioning is best-effort;
        // invoice creation should not fail if the provider is unavailable.
      }
    }

    const saved = await invoiceRepository.upsert({
      businessId,
      id: input.id,
      customerId: existing.customerId,
      virtualAccountId,
      invoiceNumber: existing.invoiceNumber,
      amount: toNumber(existing.amount),
      currency: existing.currency,
      status,
      issueDate: input.scheduledAt ?? existing.issueDate ?? new Date().toISOString(),
      dueDate: existing.dueDate,
      lineItems: existing.lineItems,
    });

    if (!saved) {
      throw new Error("Failed to create invoice");
    }

    return { id: saved.id };
  },

  async update(userId: string, id: string, data: RawInvoiceData) {
    const businessId = await getBusinessIdForUser(userId);
    if (!businessId) {
      throw new Error("Business required");
    }

    const existing = await invoiceRepository.findById(businessId, id);
    if (!existing) {
      throw new Error("Invoice not found");
    }

    const hasAmountData =
      data.amount != null ||
      (Array.isArray(data.lineItems) && data.lineItems.length > 0);
    const amount = hasAmountData ? calculateAmount(data) : toNumber(existing.amount);
    const status = data.status ?? (existing.status as InvoiceStatus);
    let amountPaid = toNumber(existing.amountPaid);
    let paidAt = existing.paidAt;

    if (status === "paid") {
      amountPaid = amount;
      paidAt = data.paidAt ?? new Date().toISOString();
    }

    const saved = await invoiceRepository.upsert({
      businessId,
      id,
      customerId: data.customerId !== undefined ? data.customerId : existing.customerId,
      virtualAccountId:
        data.virtualAccountId !== undefined
          ? data.virtualAccountId
          : existing.virtualAccountId,
      invoiceNumber: data.invoiceNumber?.trim() || existing.invoiceNumber,
      amount,
      amountPaid,
      currency: data.template?.currency ?? data.currency ?? existing.currency,
      status,
      issueDate: data.scheduledAt ?? data.issueDate ?? existing.issueDate,
      dueDate: data.dueDate !== undefined ? data.dueDate : existing.dueDate,
      paidAt,
      lineItems:
        data.lineItems !== undefined ? data.lineItems : existing.lineItems,
    });

    if (!saved) {
      throw new Error("Failed to update invoice");
    }

    return { success: true, id: saved.id };
  },

  async delete(userId: string, id: string) {
    const businessId = await getBusinessIdForUser(userId);
    if (!businessId) {
      return { success: false };
    }

    await invoiceRepository.delete(businessId, id);
    return { success: true };
  },
};
