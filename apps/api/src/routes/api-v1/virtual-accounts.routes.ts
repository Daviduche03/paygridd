import { Router } from "express";
import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticateApiKey, requireScope } from "@/middleware/api-key-auth.middleware";
import { virtualAccountRepository } from "@/repositories/virtual-account.repository";

function stripInternalFields<T extends Record<string, unknown>>(va: T): Omit<T, "nombaAccountHolderId"> {
  const { nombaAccountHolderId: _, ...rest } = va;
  return rest as Omit<T, "nombaAccountHolderId">;
}

export const virtualAccountsRoutes = Router();

virtualAccountsRoutes.use(authenticateApiKey);

virtualAccountsRoutes.get(
  "/",
  requireScope("customers.read"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const { cursor, pageSize, q, status, customerId } = req.query as Record<string, string | undefined>;
    const result = await virtualAccountRepository.list({
      businessId,
      cursor: cursor ?? null,
      pageSize: pageSize ? Number(pageSize) : undefined,
      q: q ?? null,
      status: (status ?? null) as any,
      customerId: customerId ?? null,
    });
    res.json({ success: true, data: result.data.map(stripInternalFields), meta: result.meta });
  }),
);

virtualAccountsRoutes.post(
  "/",
  requireScope("customers.write"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const { customerId, accountRef, accountName, accountNumber, bankName, currency, expectedAmount } = req.body;
    if (!accountRef || !accountName || !accountNumber) {
      res.status(400).json({ success: false, error: "accountRef, accountName, and accountNumber are required" });
      return;
    }
    const va = await virtualAccountRepository.create({
      businessId,
      customerId: customerId ?? null,
      accountRef,
      accountName,
      accountNumber,
      bankName: bankName ?? null,
      currency: currency ?? "NGN",
      expectedAmount: expectedAmount ?? null,
    });
    if (!va) {
      res.status(500).json({ success: false, error: "Failed to create virtual account" });
      return;
    }
    res.status(201).json({ success: true, data: stripInternalFields(va) });
  }),
);

virtualAccountsRoutes.get(
  "/:id",
  requireScope("customers.read"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const id = req.params.id!;
    const va = await virtualAccountRepository.findById(businessId, id);
    if (!va) {
      res.status(404).json({ success: false, error: "Virtual account not found" });
      return;
    }
    res.json({ success: true, data: stripInternalFields(va) });
  }),
);
