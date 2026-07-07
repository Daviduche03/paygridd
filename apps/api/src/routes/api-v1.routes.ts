import { Router } from "express";
import { businessRoutes } from "@/routes/api-v1/business.routes";
import { customersRoutes } from "@/routes/api-v1/customers.routes";
import { invoicesRoutes } from "@/routes/api-v1/invoices.routes";
import { transactionsRoutes } from "@/routes/api-v1/transactions.routes";
import { virtualAccountsRoutes } from "@/routes/api-v1/virtual-accounts.routes";
import { webhooksRoutes } from "@/routes/api-v1/webhooks.routes";

export const apiV1Routes = Router();

apiV1Routes.use("/customers", customersRoutes);
apiV1Routes.use("/virtual-accounts", virtualAccountsRoutes);
apiV1Routes.use("/invoices", invoicesRoutes);
apiV1Routes.use("/transactions", transactionsRoutes);
apiV1Routes.use("/business", businessRoutes);
apiV1Routes.use("/webhooks", webhooksRoutes);
