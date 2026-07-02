import { db } from "@/config/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface User {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  businessId: string | null;
  createdAt: string | null;
}

export const userRepository = {
  async findAll(limit = 50): Promise<User[]> {
    const result = await db.select().from(users).limit(limit);
    return result as User[];
  },

  async findById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return (user as User) || null;
  },

  async update(id: string, data: Record<string, unknown>): Promise<User | null> {
    const allowedColumns = ["fullName", "avatarUrl"];
    const setData: Record<string, unknown> = {};

    for (const key of allowedColumns) {
      if (key in data) {
        setData[key] = data[key];
      }
    }

    if (Object.keys(setData).length === 0) return this.findById(id);

    const [updated] = await db
      .update(users)
      .set(setData)
      .where(eq(users.id, id))
      .returning();

    return (updated as User) || null;
  },

  async switchBusiness(id: string, businessId: string): Promise<void> {
    await db
      .update(users)
      .set({ businessId })
      .where(eq(users.id, id));
  },

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return (user as User) || null;
  },

  async createOrUpdateFromGoogle(googleData: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  }): Promise<User> {
    const existing = await this.findByEmail(googleData.email);

    if (existing) {
      // Optionally update avatar/name
      return existing;
    }

    const [newUser] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: googleData.email,
        fullName: googleData.fullName,
        avatarUrl: googleData.avatarUrl,
      })
      .returning();

    return newUser as User;
  },
};

