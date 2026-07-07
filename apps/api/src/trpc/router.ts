import { t } from "@/trpc/init";
import { apiKeysRouter } from "@/trpc/routers/api-keys.router";
import {
  banksRouter,
  businessRouter,
  institutionsRouter,
  overviewRouter,
} from "@/trpc/routers/core.router";
import { customersRouter } from "@/trpc/routers/customers.router";
import { invoicesRouter } from "@/trpc/routers/invoices.router";
import { kycRouter } from "@/trpc/routers/kyc.router";
import { payoutsRouter } from "@/trpc/routers/payouts.router";
import { statementsRouter } from "@/trpc/routers/statements.router";
import { transactionsRouter } from "@/trpc/routers/transactions.router";
import { userRouter } from "@/trpc/routers/user.router";
import { virtualAccountsRouter } from "@/trpc/routers/virtual-accounts.router";

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
  statements: statementsRouter,
  payouts: payoutsRouter,
});

export type AppRouter = typeof appRouter;
