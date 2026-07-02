import { z } from "zod";
import { protectedProcedure, publicProcedure, stubList, stubMutation, stubQuery, t } from "@/trpc/init";

export const documentsRouter = t.router({
  list: publicProcedure
    .input(z.object({ businessId: z.string().optional() }).optional())
    .query(async () => []),
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async () => null),
  checkAttachments: stubMutation(z.object({ ids: z.array(z.string()) })),
  delete: stubMutation(z.object({ id: z.string() })),
  get: protectedProcedure
    .input(z.object({}).optional())
    .query(async () => ({ data: [], meta: { cursor: null } })),
  getRelatedDocuments: stubQuery(z.object({ documentId: z.string() })),
  processDocument: stubMutation(z.object({ id: z.string() })),
  reprocessDocument: stubMutation(z.object({ id: z.string() })),
  signedUrls: stubQuery(z.object({ ids: z.array(z.string()) })),
});

export const notificationsRouter = t.router({
  list: protectedProcedure
    .input(
      z
        .object({
          maxPriority: z.number().optional(),
          pageSize: z.number().optional(),
          status: z.union([z.string(), z.array(z.string())]).optional(),
        })
        .optional(),
    )
    .query(async () => ({
      data: [],
      meta: { cursor: null, hasPreviousPage: false, hasNextPage: false },
    })),
  updateStatus: protectedProcedure
    .input(z.object({ activityId: z.string(), status: z.string() }))
    .mutation(async () => ({ success: true })),
  updateAllStatus: protectedProcedure
    .input(z.object({ status: z.string() }))
    .mutation(async () => ({ success: true })),
});

export const connectorsRouter = t.router({
  list: stubList(),
  connections: stubList(),
  detail: stubQuery(z.object({ slug: z.string() })),
  authorize: stubMutation(z.object({ slug: z.string().optional(), uri: z.string().optional() })),
  disconnect: stubMutation(z.object({ id: z.string() })),
});

export const accountingRouter = t.router({ export: stubMutation(z.object({})) });
export const apiKeysRouter = t.router({
  delete: stubMutation(z.object({ id: z.string() })),
  get: stubQuery(z.object({ id: z.string() })),
  upsert: stubMutation(z.object({})),
});
export const appsRouter = t.router({
  createPlatformLinkToken: stubMutation(z.object({})),
  disconnect: stubMutation(z.object({ id: z.string() })),
  get: stubQuery(z.object({ id: z.string() })),
  update: stubMutation(z.object({ id: z.string() })),
});
export const bankAccountsRouter = t.router({
  create: stubMutation(z.object({})),
  currencies: stubList(),
  delete: stubMutation(z.object({ id: z.string() })),
  get: stubQuery(z.object({ id: z.string() })),
  getDetails: stubQuery(z.object({ id: z.string() })),
  getTransactionCount: stubQuery(z.object({ accountId: z.string() })),
  getWithPaymentInfo: stubQuery(z.object({ id: z.string() })),
  update: stubMutation(z.object({ id: z.string() })),
});
export const bankConnectionsRouter = t.router({
  addAccounts: stubMutation(z.object({})),
  create: stubMutation(z.object({})),
  delete: stubMutation(z.object({ id: z.string() })),
  get: stubQuery(z.object({ id: z.string() })),
  reconnect: stubMutation(z.object({ id: z.string() })),
});
export const bankingRouter = t.router({
  enablebankingExchange: stubMutation(z.object({})),
  enablebankingLink: stubMutation(z.object({})),
  getProviderAccounts: stubQuery(z.object({})),
  gocardlessAgreement: stubMutation(z.object({})),
  gocardlessLink: stubMutation(z.object({})),
  plaidExchange: stubMutation(z.object({})),
  plaidLink: stubMutation(z.object({})),
});
export const billingRouter = t.router({
  cancelSubscription: stubMutation(z.object({})),
  checkInvoiceStatus: stubQuery(z.object({ invoiceId: z.string() })),
  createCheckout: stubMutation(z.object({})),
  getActiveSubscription: stubQuery(),
  getInvoice: stubQuery(z.object({ invoiceId: z.string() })),
  getPortalUrl: stubQuery(),
  orders: stubList(),
  reactivateSubscription: stubMutation(z.object({})),
});
export const documentTagAssignmentsRouter = t.router({
  create: stubMutation(z.object({})),
  delete: stubMutation(z.object({ id: z.string() })),
});
export const documentTagsRouter = t.router({
  create: stubMutation(z.object({})),
  delete: stubMutation(z.object({ id: z.string() })),
  get: stubQuery(z.object({ id: z.string() })),
});
export const inboxRouter = t.router({
  blocklist: stubMutation(z.object({})),
  checkAttachments: stubMutation(z.object({})),
  confirmMatch: stubMutation(z.object({})),
  create: stubMutation(z.object({})),
  declineMatch: stubMutation(z.object({})),
  delete: stubMutation(z.object({ id: z.string() })),
  deleteMany: stubMutation(z.object({ ids: z.array(z.string()) })),
  get: protectedProcedure
    .input(z.object({}).optional())
    .query(async () => ({ data: [], meta: { cursor: null } })),
  getById: stubQuery(z.object({ id: z.string() })),
  matchTransaction: stubMutation(z.object({})),
  processAttachments: stubMutation(z.object({})),
  retryMatching: stubMutation(z.object({})),
  unmatchTransaction: stubMutation(z.object({})),
  update: stubMutation(z.object({ id: z.string() })),
});
export const inboxAccountsRouter = t.router({
  connect: stubMutation(z.object({})),
  delete: stubMutation(z.object({ id: z.string() })),
  get: stubQuery(z.object({ id: z.string() })),
  sync: stubMutation(z.object({ id: z.string() })),
});
export const invoicePaymentsRouter = t.router({
  disconnectStripe: stubMutation(z.object({})),
  refundPayment: stubMutation(z.object({})),
  stripeStatus: stubQuery(),
});
export const invoiceProductsRouter = t.router({
  create: stubMutation(z.object({})),
  delete: stubMutation(z.object({ id: z.string() })),
  get: stubList(),
  getById: stubQuery(z.object({ id: z.string() })),
  incrementUsage: stubMutation(z.object({ id: z.string() })),
  saveLineItemAsProduct: stubMutation(z.object({})),
  updateProduct: stubMutation(z.object({ id: z.string() })),
});
export const invoiceRecurringRouter = t.router({
  create: stubMutation(z.object({})),
  delete: stubMutation(z.object({ id: z.string() })),
  get: stubQuery(z.object({ id: z.string() })),
  getUpcoming: stubQuery(z.object({})),
  list: stubList(),
  pause: stubMutation(z.object({ id: z.string() })),
  resume: stubMutation(z.object({ id: z.string() })),
  update: stubMutation(z.object({ id: z.string() })),
});
export const invoiceTemplateRouter = t.router({
  count: stubQuery(),
  create: stubMutation(z.object({})),
  delete: stubMutation(z.object({ id: z.string() })),
  list: stubList(),
  setDefault: stubMutation(z.object({ id: z.string() })),
  upsert: stubMutation(z.object({})),
});
export const jobsRouter = t.router({ getStatus: stubQuery(z.object({ jobId: z.string() })) });
export const notificationSettingsRouter = t.router({
  getAll: stubQuery(),
  update: stubMutation(z.object({})),
});
export const oauthApplicationsRouter = t.router({
  authorize: stubMutation(z.object({})),
  authorized: stubList(),
  create: stubMutation(z.object({})),
  delete: stubMutation(z.object({ id: z.string() })),
  get: stubQuery(z.object({ id: z.string() })),
  getApplicationInfo: stubQuery(z.object({ id: z.string() })),
  list: stubList(),
  revokeAccess: stubMutation(z.object({ id: z.string() })),
  update: stubMutation(z.object({ id: z.string() })),
  updateApprovalStatus: stubMutation(z.object({})),
});
export const reportsRouter = t.router({
  burnRate: stubQuery(),
  create: stubMutation(z.object({})),
  expense: stubQuery(),
  getAccountBalances: stubQuery(),
  getByLinkId: stubQuery(z.object({ linkId: z.string() })),
  getChartDataByLinkId: stubQuery(z.object({ linkId: z.string() })),
  profit: stubQuery(),
  revenue: stubQuery(),
  revenueForecast: stubQuery(),
  runway: stubQuery(),
  spending: stubQuery(),
  taxSummary: stubQuery(),
});
export const searchRouter = t.router({
  attachments: stubQuery(z.object({ q: z.string() })),
  global: stubQuery(z.object({ q: z.string() })),
});
export const shortLinksRouter = t.router({
  createForDocument: stubMutation(z.object({ documentId: z.string() })),
  get: stubQuery(z.object({ id: z.string() })),
});
export const tagsRouter = t.router({
  create: stubMutation(z.object({})),
  delete: stubMutation(z.object({ id: z.string() })),
  get: stubQuery(z.object({ id: z.string() })),
  update: stubMutation(z.object({ id: z.string() })),
});
export const trackerEntriesRouter = t.router({
  byDate: stubQuery(z.object({ date: z.string() })),
  byRange: stubQuery(z.object({ from: z.string(), to: z.string() })),
  delete: stubMutation(z.object({ id: z.string() })),
  getBillableHours: stubQuery(z.object({})),
  getCurrentTimer: stubQuery(),
  getTimerStatus: protectedProcedure.query(async () => ({
    isRunning: false,
    elapsedTime: 0,
    currentEntry: null,
  })),
  startTimer: stubMutation(z.object({})),
  stopTimer: stubMutation(z.object({})),
  upsert: stubMutation(z.object({})),
});
export const trackerProjectsRouter = t.router({
  delete: stubMutation(z.object({ id: z.string() })),
  get: protectedProcedure
    .input(z.object({}).optional())
    .query(async () => ({ data: [], meta: { cursor: null } })),
  getById: stubQuery(z.object({ id: z.string() })),
  upsert: stubMutation(z.object({})),
});
export const transactionAttachmentsRouter = t.router({
  createMany: stubMutation(z.object({})),
  delete: stubMutation(z.object({ id: z.string() })),
  processAttachment: stubMutation(z.object({ id: z.string() })),
});
export const transactionCategoriesRouter = t.router({
  create: stubMutation(z.object({})),
  delete: stubMutation(z.object({ id: z.string() })),
  get: stubQuery(z.object({ id: z.string() })),
  getById: stubQuery(z.object({ id: z.string() })),
  update: stubMutation(z.object({ id: z.string() })),
});
export const transactionTagsRouter = t.router({
  create: stubMutation(z.object({})),
  delete: stubMutation(z.object({ id: z.string() })),
});
