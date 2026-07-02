import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { customerRepository } from "@/repositories/customer.repository";
import { invoiceRepository } from "@/repositories/invoice.repository";
import { customerService } from "@/services/customer.service";
import { getBusinessIdForUser } from "@/utils/business";
import { logger } from "@/utils/logger";
import { protectedProcedure, stubMutation, t } from "@/trpc/init";

const upsertInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  billingEmail: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  countryCode: z.string().optional().nullable(),
});

export const customersRouter = t.router({
  cancelEnrichment: stubMutation(z.object({ id: z.string() })),
  clearEnrichment: stubMutation(z.object({ id: z.string() })),
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const businessId = await getBusinessIdForUser(ctx.user.id);
      if (!businessId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Business required" });
      }

      const openInvoiceCount = await invoiceRepository.countOpenByCustomerId(
        businessId,
        input.id,
      );

      if (openInvoiceCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot delete a customer with open invoices. Close or cancel their invoices first.",
        });
      }

      const deleted = await customerRepository.delete(businessId, input.id);

      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
      }

      return { success: true };
    }),
  enrich: stubMutation(z.object({ id: z.string() })),
  get: protectedProcedure
    .input(
      z
        .object({
          q: z.string().nullish(),
          sort: z.array(z.string()).nullish(),
          start: z.string().nullish(),
          end: z.string().nullish(),
          pageSize: z.coerce.number().nullish(),
          cursor: z.string().nullish(),
        })
        .nullish(),
    )
    .query(async ({ ctx, input }) => {
      const businessId = await getBusinessIdForUser(ctx.user.id);
      if (!businessId) {
        return { data: [], meta: { cursor: null } };
      }

      return customerRepository.list({
        businessId,
        cursor: input?.cursor,
        pageSize: input?.pageSize ?? 25,
        q: input?.q,
        sort: input?.sort,
      });
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const businessId = await getBusinessIdForUser(ctx.user.id);
      if (!businessId) return null;
      return customerRepository.findById(businessId, input.id);
    }),
  getByPortalId: protectedProcedure.input(z.object({ portalId: z.string() })).query(async () => null),
  getInvoiceSummary: protectedProcedure.input(z.object({ customerId: z.string() })).query(async () => null),
  getPortalInvoices: protectedProcedure.input(z.object({ customerId: z.string() })).query(async () => null),
  togglePortal: stubMutation(z.object({ id: z.string() })),
  upsert: protectedProcedure.input(upsertInputSchema.passthrough()).mutation(async ({ ctx, input }) => {
    const businessId = await getBusinessIdForUser(ctx.user.id);
    if (!businessId) {
      throw new Error("Business required");
    }

    const isNew = !input.id;

    const customer = await customerRepository.upsert({
      businessId,
      id: input.id,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      billingEmail: input.billingEmail ?? null,
      country: input.country ?? null,
      countryCode: input.countryCode ?? null,
    });

    if (!customer) {
      throw new Error("Failed to save customer");
    }

    if (isNew) {
      try {
        await customerService.provisionStaticVirtualAccount(businessId, {
          id: customer.id,
          name: customer.name,
        });
      } catch (error) {
        logger.error("Customer created without static virtual account", {
          customerId: customer.id,
          businessId,
          error,
        });
      }
    }

    return customer;
  }),
});
