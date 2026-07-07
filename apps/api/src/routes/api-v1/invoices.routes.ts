import type { Response } from "express";
import { Router } from "express";
import { env } from "@/config/env";
import {
  authenticateApiKey,
  requireScope,
} from "@/middleware/api-key-auth.middleware";
import { customerRepository } from "@/repositories/customer.repository";
import { invoiceRepository } from "@/repositories/invoice.repository";
import { virtualAccountRepository } from "@/repositories/virtual-account.repository";
import type { AuthenticatedRequest } from "@/types";
import { asyncHandler } from "@/utils/asyncHandler";

export const invoicesRoutes = Router();

invoicesRoutes.use(authenticateApiKey);

invoicesRoutes.get(
  "/",
  requireScope("invoices.read"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const { cursor, pageSize, q, statuses, customerIds, dueFilter, sort } =
      req.query as Record<string, string | undefined>;
    const result = await invoiceRepository.list({
      businessId,
      cursor: cursor ?? null,
      pageSize: pageSize ? Number(pageSize) : undefined,
      q: q ?? null,
      statuses: statuses ? (statuses.split(",") as any) : undefined,
      customerIds: customerIds ? customerIds.split(",") : undefined,
      dueFilter: dueFilter as any,
      sort: sort as any,
    });
    res.json({ success: true, data: result.data, meta: result.meta });
  }),
);

invoicesRoutes.post(
  "/",
  requireScope("invoices.write"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const {
      customerId,
      virtualAccountId,
      invoiceNumber,
      amount,
      currency,
      status,
      issueDate,
      dueDate,
      lineItems,
    } = req.body;
    if (!invoiceNumber || amount == null) {
      res.status(400).json({
        success: false,
        error: "invoiceNumber and amount are required",
      });
      return;
    }
    if (customerId) {
      const customer = await customerRepository.findById(
        businessId,
        customerId,
      );
      if (!customer) {
        res.status(400).json({
          success: false,
          error: "Customer not found or does not belong to this business",
        });
        return;
      }
    }
    if (virtualAccountId) {
      const va = await virtualAccountRepository.findById(
        businessId,
        virtualAccountId,
      );
      if (!va) {
        res.status(400).json({
          success: false,
          error:
            "Virtual account not found or does not belong to this business",
        });
        return;
      }
    }
    const invoice = await invoiceRepository.upsert({
      businessId,
      customerId: customerId ?? null,
      virtualAccountId: virtualAccountId ?? null,
      invoiceNumber,
      amount: Number(amount),
      currency: currency ?? "NGN",
      status: status ?? "draft",
      issueDate: issueDate ?? null,
      dueDate: dueDate ?? null,
      lineItems: lineItems ?? null,
    });
    if (!invoice) {
      res
        .status(500)
        .json({ success: false, error: "Failed to create invoice" });
      return;
    }
    res.status(201).json({
      success: true,
      data: { ...invoice, paymentUrl: `${env.FRONTEND_URL}/i/${invoice.id}` },
    });
  }),
);

invoicesRoutes.get(
  "/:id",
  requireScope("invoices.read"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const id = req.params.id!;
    const invoice = await invoiceRepository.findById(businessId, id);
    if (!invoice) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }
    res.json({
      success: true,
      data: { ...invoice, paymentUrl: `${env.FRONTEND_URL}/i/${invoice.id}` },
    });
  }),
);

invoicesRoutes.put(
  "/:id",
  requireScope("invoices.write"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const id = req.params.id!;
    const existing = await invoiceRepository.findById(businessId, id);
    if (!existing) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }
    const {
      customerId,
      virtualAccountId,
      amount,
      currency,
      status,
      issueDate,
      dueDate,
      lineItems,
    } = req.body;
    const invoice = await invoiceRepository.upsert({
      businessId,
      id,
      invoiceNumber: existing.invoiceNumber,
      customerId: customerId ?? existing.customerId,
      virtualAccountId: virtualAccountId ?? existing.virtualAccountId,
      amount: amount != null ? Number(amount) : Number(existing.amount),
      currency: currency ?? existing.currency,
      status: status ?? existing.status,
      issueDate: issueDate ?? existing.issueDate,
      dueDate: dueDate ?? existing.dueDate,
      lineItems: lineItems ?? existing.lineItems,
    });
    if (!invoice) {
      res
        .status(500)
        .json({ success: false, error: "Failed to update invoice" });
      return;
    }
    res.json({
      success: true,
      data: { ...invoice, paymentUrl: `${env.FRONTEND_URL}/i/${invoice.id}` },
    });
  }),
);

invoicesRoutes.post(
  "/:id/cancel",
  requireScope("invoices.write"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const id = req.params.id!;
    const existing = await invoiceRepository.findById(businessId, id);
    if (!existing) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }
    if (
      existing.status === "paid" ||
      existing.status === "canceled" ||
      existing.status === "refunded"
    ) {
      res.status(400).json({
        success: false,
        error: `Cannot cancel invoice with status ${existing.status}`,
      });
      return;
    }
    const invoice = await invoiceRepository.upsert({
      businessId,
      id,
      invoiceNumber: existing.invoiceNumber,
      amount: Number(existing.amount),
      status: "canceled",
    });
    res.json({ success: true, data: invoice });
  }),
);

invoicesRoutes.post(
  "/:id/send",
  requireScope("invoices.write"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const id = req.params.id!;
    const existing = await invoiceRepository.findById(businessId, id);
    if (!existing) {
      res.status(404).json({ success: false, error: "Invoice not found" });
      return;
    }
    if (existing.status !== "draft") {
      res
        .status(400)
        .json({ success: false, error: "Only draft invoices can be sent" });
      return;
    }
    const invoice = await invoiceRepository.upsert({
      businessId,
      id,
      invoiceNumber: existing.invoiceNumber,
      amount: Number(existing.amount),
      status: "unpaid",
      issueDate: new Date().toISOString(),
    });
    res.json({ success: true, data: invoice });
  }),
);
