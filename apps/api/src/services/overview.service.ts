import { customerRepository } from "@/repositories/customer.repository";
import { invoiceRepository } from "@/repositories/invoice.repository";
import { transactionRepository } from "@/repositories/transaction.repository";
import { virtualAccountRepository } from "@/repositories/virtual-account.repository";
import { getBusinessIdForUser } from "@/utils/business";

function buildEmptySummary(currency: string) {
  return {
    openInvoices: { count: 0, totalAmount: 0, currency },
    unbilledTime: {
      totalDuration: 0,
      totalAmount: 0,
      projectCount: 0,
      currency,
    },
    inboxPending: { count: 0 },
    transactionsToReview: { count: 0 },
    virtualAccounts: { count: 0, activeCount: 0 },
    customers: { count: 0 },
    cashBalance: { totalBalance: 0, currency, accountCount: 0 },
    runway: 0,
  };
}

export const overviewService = {
  async getSummary(userId: string) {
    const businessId = await getBusinessIdForUser(userId);
    const baseCurrency = "NGN";

    if (!businessId) {
      return buildEmptySummary(baseCurrency);
    }

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

    const currency =
      openInvoices.currency || accountsSummary.currency || baseCurrency;

    return {
      openInvoices: {
        count: openInvoices.count,
        totalAmount: openInvoices.totalAmount,
        currency,
      },
      unbilledTime: {
        totalDuration: 0,
        totalAmount: 0,
        projectCount: 0,
        currency,
      },
      inboxPending: { count: 0 },
      transactionsToReview: { count: pendingReviewCount },
      virtualAccounts: {
        count: accountsSummary.count,
        activeCount: accountsSummary.activeCount,
      },
      customers: { count: customersCount },
      cashBalance: {
        totalBalance: balance.totalBalance,
        currency: balance.currency || currency,
        accountCount: accountsSummary.activeCount,
      },
      runway: 0,
    };
  },
};
