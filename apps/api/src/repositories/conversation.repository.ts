import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { chatMessages, conversations } from "@/db/schema";
import type { UIMessage } from "ai";

type ConversationRow = {
  id: string;
  businessId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export const conversationRepository = {
  async list(businessId: string): Promise<ConversationRow[]> {
    return db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.businessId, businessId),
          isNotNull(conversations.title),
        ),
      )
      .orderBy(desc(conversations.updatedAt))
      .limit(50);
  },

  async findById(
    businessId: string,
    conversationId: string,
  ): Promise<ConversationRow | null> {
    const [row] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.businessId, businessId),
        ),
      )
      .limit(1);
    return row ?? null;
  },

  async create(businessId: string, title?: string): Promise<ConversationRow> {
    const [row] = await db
      .insert(conversations)
      .values({ businessId, title: title ?? null })
      .returning();
    return row!;
  },

  async updateTitle(
    conversationId: string,
    title: string,
  ): Promise<void> {
    await db
      .update(conversations)
      .set({ title, updatedAt: new Date().toISOString() })
      .where(eq(conversations.id, conversationId));
  },

  async touch(conversationId: string): Promise<void> {
    await db
      .update(conversations)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(conversations.id, conversationId));
  },

  async delete(conversationId: string): Promise<void> {
    await db
      .delete(conversations)
      .where(eq(conversations.id, conversationId));
  },

  async getMessages(
    businessId: string,
    conversationId: string,
  ): Promise<UIMessage[]> {
    const rows = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.conversationId, conversationId),
          sql`${conversationId} IN (SELECT id FROM ${conversations} WHERE business_id = ${sql.param(businessId)})`,
        ),
      )
      .orderBy(chatMessages.createdAt);

    return rows as unknown as UIMessage[];
  },

  async saveMessage(
    conversationId: string,
    message: UIMessage,
  ): Promise<void> {
    await db.insert(chatMessages).values({
      conversationId,
      role: message.role,
      content: (message as any).content ?? null,
      parts: message.parts ?? null,
    });
  },

  async saveMessages(
    conversationId: string,
    messages: UIMessage[],
  ): Promise<void> {
    if (!messages.length) return;
    await db.insert(chatMessages).values(
      messages.map((m) => ({
        conversationId,
        role: m.role,
        content: (m as any).content ?? null,
        parts: (m as any).parts ?? null,
      })),
    );
  },
};
