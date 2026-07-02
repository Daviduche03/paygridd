import { db } from "@/config/db";
import { businesses, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface Business {
  id: string;
  name: string;
  baseCurrency: string;
  countryCode: string;
  createdAt: string;
  updatedAt: string;
}

export const businessRepository = {
  async findAll(): Promise<Business[]> {
    const result = await db.select().from(businesses).limit(100);
    return result as Business[];
  },

  async findById(id: string): Promise<Business | null> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
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

    await db
      .update(users)
      .set({ businessId: business.id })
      .where(eq(users.id, data.userId));

    return business as Business;
  },
};
