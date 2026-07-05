import { and, eq, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { users, usersOnBusiness } from "@/db/schema";

export type BusinessRole = "owner" | "admin" | "member";

export interface Membership {
  id: string;
  userId: string;
  businessId: string;
  role: BusinessRole;
  createdAt: string;
}

export const membershipRepository = {
  async findByBusiness(businessId: string): Promise<(Membership & { user: { id: string; fullName: string | null; email: string; avatarUrl: string | null } })[]> {
    const rows = await db
      .select({
        id: usersOnBusiness.id,
        userId: usersOnBusiness.userId,
        businessId: usersOnBusiness.businessId,
        role: usersOnBusiness.role,
        createdAt: usersOnBusiness.createdAt,
        user: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(usersOnBusiness)
      .leftJoin(users, eq(usersOnBusiness.userId, users.id))
      .where(eq(usersOnBusiness.businessId, businessId));

    return rows as any;
  },

  async findByUser(userId: string): Promise<Membership[]> {
    const rows = await db
      .select()
      .from(usersOnBusiness)
      .where(eq(usersOnBusiness.userId, userId));

    return rows as Membership[];
  },

  async findOne(userId: string, businessId: string): Promise<Membership | null> {
    const [row] = await db
      .select()
      .from(usersOnBusiness)
      .where(and(eq(usersOnBusiness.userId, userId), eq(usersOnBusiness.businessId, businessId)));

    return (row as Membership) || null;
  },

  async create(data: { userId: string; businessId: string; role: BusinessRole }): Promise<Membership> {
    const [row] = await db
      .insert(usersOnBusiness)
      .values(data)
      .returning();

    return row as Membership;
  },

  async updateRole(id: string, role: BusinessRole): Promise<Membership | null> {
    const [row] = await db
      .update(usersOnBusiness)
      .set({ role })
      .where(eq(usersOnBusiness.id, id))
      .returning();

    return (row as Membership) || null;
  },

  async remove(id: string): Promise<void> {
    await db.delete(usersOnBusiness).where(eq(usersOnBusiness.id, id));
  },

  async removeByUserAndBusiness(userId: string, businessId: string): Promise<void> {
    await db
      .delete(usersOnBusiness)
      .where(and(eq(usersOnBusiness.userId, userId), eq(usersOnBusiness.businessId, businessId)));
  },

  async countByBusiness(businessId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersOnBusiness)
      .where(eq(usersOnBusiness.businessId, businessId));

    return Number(row?.count ?? 0);
  },

  async findUserBusinessIds(userId: string): Promise<string[]> {
    const rows = await db
      .select({ businessId: usersOnBusiness.businessId })
      .from(usersOnBusiness)
      .where(eq(usersOnBusiness.userId, userId));

    return rows.map((r) => r.businessId);
  },
};
