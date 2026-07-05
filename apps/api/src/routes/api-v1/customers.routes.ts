import { Router } from "express";
import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticateApiKey, requireScope } from "@/middleware/api-key-auth.middleware";
import { customerRepository } from "@/repositories/customer.repository";

export const customersRoutes = Router();

customersRoutes.use(authenticateApiKey);

customersRoutes.get(
  "/",
  requireScope("customers.read"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const { cursor, pageSize, q, sort } = req.query as Record<string, string | undefined>;
    const result = await customerRepository.list({
      businessId,
      cursor: cursor ?? null,
      pageSize: pageSize ? Number(pageSize) : undefined,
      q: q ?? null,
      sort: sort as any,
    });
    res.json({ success: true, data: result.data, meta: result.meta });
  }),
);

customersRoutes.post(
  "/",
  requireScope("customers.write"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const { name, email, phone, billingEmail, country, countryCode } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: "name is required" });
      return;
    }
    const customer = await customerRepository.upsert({
      businessId,
      name,
      email,
      phone,
      billingEmail,
      country,
      countryCode,
    });
    res.status(201).json({ success: true, data: customer });
  }),
);

customersRoutes.get(
  "/:id",
  requireScope("customers.read"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const id = req.params.id!;
    const customer = await customerRepository.findById(businessId, id);
    if (!customer) {
      res.status(404).json({ success: false, error: "Customer not found" });
      return;
    }
    res.json({ success: true, data: customer });
  }),
);

customersRoutes.put(
  "/:id",
  requireScope("customers.write"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { businessId } = req.apiKey!;
    const id = req.params.id!;
    const existing = await customerRepository.findById(businessId, id);
    if (!existing) {
      res.status(404).json({ success: false, error: "Customer not found" });
      return;
    }
    const { name, email, phone, billingEmail, country, countryCode } = req.body;
    const customer = await customerRepository.upsert({
      businessId,
      id,
      name: name ?? existing.name,
      email: email ?? existing.email,
      phone: phone ?? existing.phone,
      billingEmail: billingEmail ?? existing.billingEmail,
      country: country ?? existing.country,
      countryCode: countryCode ?? existing.countryCode,
    });
    res.json({ success: true, data: customer });
  }),
);
