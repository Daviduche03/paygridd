import { eq } from "drizzle-orm";
import { db } from "@/config/db";
import { businesses, users, usersOnBusiness } from "@/db/schema";

export interface Business {
  id: string;
  name: string;
  baseCurrency: string;
  countryCode: string;
  platformChargeRate: string | null;
  settlementBankName: string | null;
  settlementBankCode: string | null;
  settlementAccountNumber: string | null;
  settlementAccountName: string | null;
  createdAt: string;
  updatedAt: string;
}

export const businessRepository = {
  async findAll(): Promise<Business[]> {
    const result = await db.select().from(businesses).limit(100);
    return result as Business[];
  },

  async findById(id: string): Promise<Business | null> {
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, id));
    return (business as Business) || null;
  },

  async delete(id: string): Promise<void> {
    await db.delete(businesses).where(eq(businesses.id, id));
  },

  async create(data: {
    name: string;
    baseCurrency?: string | null;
    countryCode?: string | null;
    userId: string;
  }): Promise<Business> {
    const [business] = await db
      .insert(businesses)
      .values({
        name: data.name,
        baseCurrency: data.baseCurrency ?? "NGN",
        countryCode: data.countryCode ?? "NG",
      })
      .returning();

    if (!business) {
      throw new Error("Failed to create business");
    }

    await db.insert(usersOnBusiness).values({
      userId: data.userId,
      businessId: business.id,
      role: "owner",
    });

    await db
      .update(users)
      .set({ businessId: business.id })
      .where(eq(users.id, data.userId));

    return business as Business;
  },

  async updateSettlementAccount(
    id: string,
    data: {
      settlementBankName: string;
      settlementBankCode: string;
      settlementAccountNumber: string;
      settlementAccountName: string;
    },
  ): Promise<Business | null> {
    const [updated] = await db
      .update(businesses)
      .set({
        settlementBankName: data.settlementBankName,
        settlementBankCode: data.settlementBankCode,
        settlementAccountNumber: data.settlementAccountNumber,
        settlementAccountName: data.settlementAccountName,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businesses.id, id))
      .returning();

    return updated as Business | null;
  },
};
