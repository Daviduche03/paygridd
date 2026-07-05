import { t } from "@/trpc/init";
import { userRouter } from "@/trpc/routers/user.router";
import {
  banksRouter,
  institutionsRouter,
  overviewRouter,
  businessRouter,
} from "@/trpc/routers/core.router";
import { apiKeysRouter } from "@/trpc/routers/api-keys.router";
import { customersRouter } from "@/trpc/routers/customers.router";
import { kycRouter } from "@/trpc/routers/kyc.router";
import { transactionsRouter } from "@/trpc/routers/transactions.router";
import { virtualAccountsRouter } from "@/trpc/routers/virtual-accounts.router";
import { invoicesRouter } from "@/trpc/routers/invoices.router";

export const appRouter = t.router({
  user: userRouter,
  business: businessRouter,
  banks: banksRouter,
  transactions: transactionsRouter,
  invoice: invoicesRouter,
  institutions: institutionsRouter,
  overview: overviewRouter,
  customers: customersRouter,
  kyc: kycRouter,
  virtualAccounts: virtualAccountsRouter,
  apiKeys: apiKeysRouter,
});

export type AppRouter = typeof appRouter;
