import { virtualAccountService } from "@/services/virtual-account.service";
import { logger } from "@/utils/logger";

export const customerService = {
  async provisionStaticVirtualAccount(
    businessId: string,
    customer: { id: string; name: string },
  ) {
    try {
      return await virtualAccountService.createStaticForCustomer({
        businessId,
        customerId: customer.id,
        customerName: customer.name,
      });
    } catch (error) {
      logger.error("Failed to provision static virtual account for customer", {
        customerId: customer.id,
        businessId,
        error,
      });
      throw error;
    }
  },
};
