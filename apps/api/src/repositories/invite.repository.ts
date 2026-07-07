import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/config/db";
import { businessInvites, users } from "@/db/schema";
import type { BusinessRole } from "./membership.repository";

export type InviteStatus = "pending" | "accepted" | "declined" | "expired";

export interface Invite {
  id: string;
  businessId: string;
  email: string;
  role: BusinessRole;
  status: InviteStatus;
  invitedBy: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const inviteRepository = {
  async findByBusiness(businessId: string): Promise<
    (Invite & {
      inviter: { id: string; fullName: string | null; email: string } | null;
    })[]
  > {
    const rows = await db
      .select({
        id: businessInvites.id,
        businessId: businessInvites.businessId,
        email: businessInvites.email,
        role: businessInvites.role,
        status: businessInvites.status,
        invitedBy: businessInvites.invitedBy,
        expiresAt: businessInvites.expiresAt,
        createdAt: businessInvites.createdAt,
        updatedAt: businessInvites.updatedAt,
        inviter: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
        },
      })
      .from(businessInvites)
      .leftJoin(users, eq(businessInvites.invitedBy, users.id))
      .where(
        and(
          eq(businessInvites.businessId, businessId),
          eq(businessInvites.status, "pending"),
        ),
      );

    return rows as any;
  },

  async findByEmail(
    email: string,
  ): Promise<(Invite & { businessName: string })[]> {
    const { businesses } = await import("@/db/schema");
    const rows = await db
      .select({
        id: businessInvites.id,
        businessId: businessInvites.businessId,
        email: businessInvites.email,
        role: businessInvites.role,
        status: businessInvites.status,
        invitedBy: businessInvites.invitedBy,
        expiresAt: businessInvites.expiresAt,
        createdAt: businessInvites.createdAt,
        updatedAt: businessInvites.updatedAt,
        businessName: businesses.name,
      })
      .from(businessInvites)
      .leftJoin(businesses, eq(businessInvites.businessId, businesses.id))
      .where(
        and(
          eq(businessInvites.email, email),
          eq(businessInvites.status, "pending"),
        ),
      );

    return rows as any;
  },

  async findById(id: string): Promise<Invite | null> {
    const [row] = await db
      .select()
      .from(businessInvites)
      .where(eq(businessInvites.id, id));

    return (row as Invite) || null;
  },

  async findPending(businessId: string, email: string): Promise<Invite | null> {
    const [row] = await db
      .select()
      .from(businessInvites)
      .where(
        and(
          eq(businessInvites.businessId, businessId),
          eq(businessInvites.email, email),
          eq(businessInvites.status, "pending"),
        ),
      );

    return (row as Invite) || null;
  },

  async create(data: {
    businessId: string;
    email: string;
    role: BusinessRole;
    invitedBy: string;
    expiresAt?: string;
  }): Promise<Invite> {
    const expiresAt =
      data.expiresAt ??
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const [row] = await db
      .insert(businessInvites)
      .values({
        businessId: data.businessId,
        email: data.email,
        role: data.role,
        invitedBy: data.invitedBy,
        expiresAt,
      })
      .returning();

    return row as Invite;
  },

  async updateStatus(id: string, status: InviteStatus): Promise<Invite | null> {
    const [row] = await db
      .update(businessInvites)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(businessInvites.id, id))
      .returning();

    return (row as Invite) || null;
  },

  async remove(id: string): Promise<void> {
    await db.delete(businessInvites).where(eq(businessInvites.id, id));
  },
};
