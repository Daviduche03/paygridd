import type { Business } from "@/repositories/business.repository";
import { businessRepository } from "@/repositories/business.repository";

export const businessService = {
  async getAllBusinesses(): Promise<Business[]> {
    return businessRepository.findAll();
  },

  async getBusinessById(id: string): Promise<Business | null> {
    if (!id) throw new Error("Business id is required");
    return businessRepository.findById(id);
  },

  async deleteBusiness(id: string): Promise<void> {
    await businessRepository.delete(id);
  },

  async createBusiness(data: {
    name: string;
    baseCurrency?: string | null;
    countryCode?: string | null;
    userId: string;
  }): Promise<Business> {
    return businessRepository.create(data);
  },
};
