import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, isStepCount, streamText, tool } from "ai";
import { Router } from "express";
import { z } from "zod/v4";
import { env } from "@/config/env";
import { authMiddleware } from "@/middleware/auth.middleware";
import { conversationRepository } from "@/repositories/conversation.repository";
import { customerRepository } from "@/repositories/customer.repository";
import { invoiceRepository } from "@/repositories/invoice.repository";
import { transactionRepository } from "@/repositories/transaction.repository";
import { virtualAccountRepository } from "@/repositories/virtual-account.repository";
import type { AuthenticatedRequest } from "@/types";
import { getBusinessIdForUser } from "@/utils/business";
import { logger } from "@/utils/logger";

const router = Router();

// All chat routes require auth
router.use(authMiddleware);

const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY || undefined,
});

router.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { messages, timezone, localTime, conversationId: reqConversationId } = req.body;

    if (!env.OPENROUTER_API_KEY) {
      res.status(501).json({
        success: false,
        error:
          "Chat is not configured. Set OPENROUTER_API_KEY to enable the AI assistant.",
      });
      return;
    }

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ success: false, error: "messages are required" });
      return;
    }

    const userId = req.user?.id;
    const businessId = userId ? await getBusinessIdForUser(userId) : null;

    if (!businessId) {
      res
        .status(403)
        .json({ success: false, error: "Business context required" });
      return;
    }

    let conversationId = reqConversationId;
    if (conversationId) {
      const existing = await conversationRepository.findById(businessId, conversationId);
      if (!existing) {
        conversationId = undefined;
      }
    }
    if (!conversationId) {
      const conv = await conversationRepository.create(businessId);
      conversationId = conv.id;
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "user") {
      await conversationRepository.saveMessage(conversationId, lastMessage);
    }

    const model = openrouter.chat(env.OPENROUTER_MODEL);

    const systemMessage = `You are PayGrid's AI assistant. Help users with their business finance questions.

Current time: ${localTime ?? new Date().toISOString()}
User timezone: ${timezone ?? "UTC"}
Business ID: ${businessId}

You can help users with:
- Viewing transactions and summaries
- Checking balances
- Looking up invoices and their status
- Finding customer information
- Creating invoices for customers
- Creating new customers
- Getting business overview data

Always ask clarifying questions if the user's request is ambiguous.
Keep responses concise and data-driven. Use markdown for formatting.
For monetary amounts, format as NGN XXX,XXX.XX.
For dates, be conversational (e.g., "March 15th" or "Today", "Yesterday").`;

    const modelMessages = await convertToModelMessages(messages, {});

    const isFirstExchange = messages.filter((m: any) => m.role !== "system").length <= 1;

    const result = streamText({
      model,
      system: systemMessage,
      messages: modelMessages,
      tools: {
        transactions_list: tool({
          description:
            "List recent transactions with optional filters for date range, status, type, or search query",
          inputSchema: z.object({
            limit: z.number().optional().default(20),
            status: z
              .enum(["posted", "pending", "failed", "reversed"])
              .optional()
              .describe("Filter by status: posted, pending, failed, reversed"),
            type: z.enum(["credit", "debit"]).optional(),
            dateRange: z
              .enum(["today", "7d", "30d", "90d", "all"])
              .optional()
              .default("30d"),
            q: z
              .string()
              .optional()
              .describe("Search query for reference, customer, or sender name"),
          }),
          execute: async ({ limit, status, type, dateRange, q }) => {
            const rows = await transactionRepository.list({
              businessId,
              pageSize: limit,
              status: status ?? null,
              type: type ?? null,
              dateFrom:
                dateRange && dateRange !== "all"
                  ? new Date(
                      Date.now() -
                        (dateRange === "today"
                          ? 0
                          : dateRange === "7d"
                            ? 7
                            : dateRange === "30d"
                              ? 30
                              : 90) *
                          86400000,
                    ).toISOString()
                  : null,
              q: q ?? null,
            });

            return rows.data.map((r) => ({
              reference: r.reference,
              amount: Number(r.amount),
              currency: r.currency,
              type: r.type,
              status: r.status,
              senderName: r.senderName,
              customerName: r.customerName,
              date: r.occurredAt ?? r.createdAt,
            }));
          },
        }),

        transactions_summary: tool({
          description: "Get transaction summary statistics (counts, volume)",
          inputSchema: z.object({}),
          execute: async () => {
            return transactionRepository.getPageSummary(businessId);
          },
        }),

        balance_get: tool({
          description: "Get the current business balance across all accounts",
          inputSchema: z.object({}),
          execute: async () => {
            const balance =
              await transactionRepository.getBusinessBalance(businessId);
            const accounts =
              await virtualAccountRepository.getBusinessSummary(businessId);
            return {
              totalBalance: Number(balance.totalBalance),
              currency: balance.currency,
              accountCount: accounts.activeCount,
            };
          },
        }),

        invoices_list: tool({
          description:
            "List invoices with optional filters for status, customer, or search",
          inputSchema: z.object({
            limit: z.number().optional().default(20),
            statuses: z
              .array(z.enum(["draft", "unpaid", "overdue", "paid", "canceled"]))
              .optional(),
            q: z
              .string()
              .optional()
              .describe("Search query for invoice number or customer name"),
          }),
          execute: async ({ limit, statuses, q }) => {
            const result = await invoiceRepository.list({
              businessId,
              pageSize: limit,
              statuses: (statuses as any) ?? null,
              q: q ?? null,
            });

            return result.data.map((r) => ({
              invoiceNumber: r.invoiceNumber,
              customerName: r.customerName,
              amount: Number(r.amount),
              amountPaid: Number(r.amountPaid),
              currency: r.currency,
              status: r.status,
              dueDate: r.dueDate,
              issueDate: r.issueDate,
            }));
          },
        }),

        invoices_summary: tool({
          description:
            "Get invoice summary statistics (counts by status, total outstanding)",
          inputSchema: z.object({}),
          execute: async () => {
            return invoiceRepository.getPageSummary(businessId);
          },
        }),

        customers_list: tool({
          description: "List customers with optional search",
          inputSchema: z.object({
            limit: z.number().optional().default(20),
            q: z
              .string()
              .optional()
              .describe("Search query for customer name or email"),
          }),
          execute: async ({ limit, q }) => {
            const result = await customerRepository.list({
              businessId,
              pageSize: limit,
              q: q ?? null,
            });

            return result.data.map((c) => ({
              name: c.name,
              email: c.email,
              phone: c.phone,
              invoiceCount: c.invoiceCount,
            }));
          },
        }),

        invoices_create: tool({
          description:
            "Create a new invoice for a customer. Provide the customer name/email, amount, currency, and optional due date and line items. Returns the created invoice details.",
          inputSchema: z.object({
            customerId: z
              .string()
              .optional()
              .describe("Customer ID if known. Leave blank to search by name/email"),
            customerName: z
              .string()
              .optional()
              .describe("Customer name to search for (used if customerId not provided)"),
            customerEmail: z
              .string()
              .optional()
              .describe("Customer email to search for (used if customerId not provided)"),
            amount: z.number().positive().describe("Invoice total amount"),
            currency: z.string().optional().default("NGN"),
            dueDate: z
              .string()
              .optional()
              .describe("Due date as ISO string or natural language like 'next week'"),
            lineItems: z
              .array(
                z.object({
                  description: z.string(),
                  quantity: z.number().positive(),
                  unitPrice: z.number().positive(),
                }),
              )
              .optional()
              .describe("Optional line items for the invoice"),
          }),
          execute: async ({
            customerId,
            customerName,
            customerEmail,
            amount,
            currency,
            dueDate,
            lineItems,
          }) => {
            let resolvedCustomerId = customerId;

            if (!resolvedCustomerId) {
              const customers = await customerRepository.list({
                businessId,
                pageSize: 5,
                q: customerName ?? customerEmail ?? null,
              });
              const match = customers.data.find(
                (c) =>
                  (customerName &&
                    c.name.toLowerCase().includes(customerName.toLowerCase())) ||
                  (customerEmail &&
                    c.email?.toLowerCase() === customerEmail.toLowerCase()),
              );
              if (match) {
                resolvedCustomerId = match.id;
              }
            }

            if (!resolvedCustomerId && customerName) {
              const created = await customerRepository.upsert({
                businessId,
                name: customerName,
                email: customerEmail ?? null,
              });
              if (created) {
                resolvedCustomerId = created.id;
              }
            }

            if (!resolvedCustomerId) {
              return {
                error:
                  "Could not find or create the customer. Please provide a customer name or ID.",
              };
            }

            const computedLineItems = lineItems?.length
              ? lineItems.map((li) => ({
                  description: li.description,
                  quantity: li.quantity,
                  unit_price: li.unitPrice,
                  total_price: li.quantity * li.unitPrice,
                }))
              : null;

            const invoice = await invoiceRepository.upsert({
              businessId,
              customerId: resolvedCustomerId,
              amount,
              currency,
              invoiceNumber: `INV-${Date.now()}`,
              dueDate: dueDate ?? null,
              lineItems: computedLineItems as any,
              status: "draft",
            });

            if (!invoice) {
              return { error: "Failed to create invoice" };
            }

            return {
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              customerId: resolvedCustomerId,
              amount: Number(invoice.amount),
              currency: invoice.currency,
              status: invoice.status,
              dueDate: invoice.dueDate,
              lineItems: computedLineItems,
            };
          },
        }),

        customers_create: tool({
          description:
            "Create a new customer with name, email, phone and country. Returns the created customer details.",
          inputSchema: z.object({
            name: z.string().min(1).describe("Customer name"),
            email: z
              .string()
              .optional()
              .describe("Customer email address"),
            phone: z
              .string()
              .optional()
              .describe("Customer phone number"),
            country: z
              .string()
              .optional()
              .describe("Customer country (name or 2-letter code)"),
          }),
          execute: async ({ name, email, phone, country }) => {
            const customer = await customerRepository.upsert({
              businessId,
              name,
              email: email ?? null,
              phone: phone ?? null,
              country: country ?? null,
            });

            if (!customer) {
              return { error: "Failed to create customer" };
            }

            return {
              id: customer.id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              country: customer.country,
            };
          },
        }),

        overview_summary: tool({
          description:
            "Get the full business overview dashboard summary including open invoices, pending transactions, customer count, and cash balance",
          inputSchema: z.object({}),
          execute: async () => {
            const [
              openInvoices,
              customersCount,
              accountsSummary,
              pendingReviewCount,
              balance,
            ] = await Promise.all([
              invoiceRepository.getOpenSummary(businessId),
              customerRepository.countByBusiness(businessId),
              virtualAccountRepository.getBusinessSummary(businessId),
              transactionRepository.countPendingReview(businessId),
              transactionRepository.getBusinessBalance(businessId),
            ]);

            return {
              openInvoices: {
                count: openInvoices.count,
                totalAmount: Number(openInvoices.totalAmount),
                currency: openInvoices.currency || "NGN",
              },
              customers: { count: customersCount },
              virtualAccounts: {
                count: accountsSummary.count,
                activeCount: accountsSummary.activeCount,
              },
              transactionsToReview: { count: pendingReviewCount },
              cashBalance: {
                totalBalance: Number(balance.totalBalance),
                currency: balance.currency || "NGN",
                accountCount: accountsSummary.activeCount,
              },
            };
          },
        }),
      },
      stopWhen: isStepCount(5),
      onFinish: async ({ text }) => {
        try {
          await conversationRepository.saveMessage(conversationId, {
            role: "assistant",
            content: text,
            parts: [{ type: "text" as const, text }],
          } as any);
          await conversationRepository.touch(conversationId);

          if (isFirstExchange && text) {
            const title = text.length > 100 ? text.slice(0, 97) + "..." : text;
            await conversationRepository.updateTitle(conversationId, title);
          }
        } catch (err) {
          logger.error("Failed to save assistant message: " + (err instanceof Error ? err.message : String(err)));
        }
      },
      onError: (error) => {
        const msg = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : JSON.stringify(error);
        logger.error(msg);
      },
    });

    res.setHeader("X-Conversation-Id", conversationId);

    result.pipeUIMessageStreamToResponse(res, {
      onError: (error) => {
        const msg = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : JSON.stringify(error);
        logger.error(msg);
        return "An error occurred while processing your request.";
      },
    });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
});

export { router as chatRoutes };
