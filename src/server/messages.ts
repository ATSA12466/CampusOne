// Node-safe messaging over REST polling. Delivery is durable and membership-
// gated; realtime sockets and push delivery are explicitly out of scope
// (see docs/MOBILE_PLAN.md) — clients poll and pull-to-refresh.
import { z } from "zod";
import { newId } from "./crypto";
import { store } from "./store";
import { campus } from "./campus";
import { notify } from "./notify";
import type { ServerUser } from "./types";

export class MessageError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "MessageError";
    this.status = status;
  }
}

export const conversationSchema = z.object({
  id: z.string().min(1).max(80),
  kind: z.enum(["direct", "group", "club"]),
  title: z.string().trim().min(1).max(80),
  clubId: z.string().max(100).default(""),
  createdBy: z.string().max(80),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const conversationMemberSchema = z.object({
  conversationId: z.string().min(1).max(80),
  userId: z.string().min(1).max(80),
  userName: z.string().max(120),
  role: z.enum(["admin", "member"]),
  lastReadAt: z.string().datetime(),
  joinedAt: z.string().datetime(),
});
export type ConversationMember = z.infer<typeof conversationMemberSchema>;

export const messageSchema = z.object({
  id: z.string().min(1).max(80),
  conversationId: z.string().min(1).max(80),
  senderId: z.string().min(1).max(80),
  senderName: z.string().max(120),
  body: z.string().trim().min(1).max(2000),
  createdAt: z.string().datetime(),
});
export type Message = z.infer<typeof messageSchema>;

const MAX_GROUP_MEMBERS = 50;

function nowIso(): string {
  return new Date().toISOString();
}

function activeUser(userId: string): ServerUser {
  const user = store.find<ServerUser>("users", (u) => u.id === userId);
  if (!user || user.status !== "active")
    throw new MessageError("That account is not available.", 404);
  return user;
}

function isClubInsider(clubId: string, userId: string): boolean {
  if (!clubId) return false;
  return campus
    .listMemberships(clubId)
    .some((m) => m.userId === userId && m.status === "approved");
}

async function touchConversation(id: string): Promise<void> {
  await store.update<Conversation>("conversations", (c) => c.id === id, { updatedAt: nowIso() });
}

export const messages = {
  getConversation: (id: string) =>
    store.find<Conversation>("conversations", (c) => c.id === id),

  /** Conversations visible to a user (direct/group membership + club insider). */
  listConversations: (userId: string) => {
    const memberOf = new Set(
      store
        .filter<ConversationMember>("conversation_members", (m) => m.userId === userId)
        .map((m) => m.conversationId),
    );
    const reads = new Map(
      store
        .filter<ConversationMember>("conversation_members", (m) => m.userId === userId)
        .map((m) => [m.conversationId, m.lastReadAt] as const),
    );
    const visible = store
      .filter<Conversation>(
        "conversations",
        (c) =>
          memberOf.has(c.id) || (c.kind === "club" && c.clubId !== "" && isClubInsider(c.clubId, userId)),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return visible.map((conversation) => {
      const lastRead = reads.get(conversation.id) ?? "1970-01-01T00:00:00.000Z";
      const thread = store.filter<Message>(
        "messages",
        (m) => m.conversationId === conversation.id,
      );
      const last = thread.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
      const unread = thread.filter((m) => m.createdAt > lastRead && m.senderId !== userId).length;
      const members =
        conversation.kind === "club"
          ? campus.listMemberships(conversation.clubId).filter((m) => m.status === "approved").length
          : store.filter<ConversationMember>(
              "conversation_members",
              (m) => m.conversationId === conversation.id,
            ).length;
      return { ...conversation, lastMessage: last, unread, members };
    });
  },

  /** Throw unless the user may read/post in the conversation. */
  async assertAccess(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = store.find<Conversation>("conversations", (c) => c.id === conversationId);
    if (!conversation) throw new MessageError("Conversation not found.", 404);
    const member = store.find<ConversationMember>(
      "conversation_members",
      (m) => m.conversationId === conversationId && m.userId === userId,
    );
    if (member) return conversation;
    if (conversation.kind === "club" && conversation.clubId && isClubInsider(conversation.clubId, userId)) {
      const user = activeUser(userId);
      await store.insert("conversation_members", {
        conversationId,
        userId,
        userName: user.name.slice(0, 120),
        role: "member",
        lastReadAt: nowIso(),
        joinedAt: nowIso(),
      });
      return conversation;
    }
    throw new MessageError("You do not have access to this conversation.", 403);
  },

  findOrCreateDirect: async (
    a: { id: string; name: string },
    otherUserId: string,
  ): Promise<Conversation> => {
    if (otherUserId === a.id) throw new MessageError("Choose another student to message.", 400);
    const other = activeUser(otherUserId);
    const mine = store
      .filter<ConversationMember>("conversation_members", (m) => m.userId === a.id)
      .map((m) => m.conversationId);
    for (const conversationId of mine) {
      const conversation = store.find<Conversation>(
        "conversations",
        (c) => c.id === conversationId && c.kind === "direct",
      );
      if (!conversation) continue;
      const members = store.filter<ConversationMember>(
        "conversation_members",
        (m) => m.conversationId === conversationId,
      );
      if (members.length === 2 && members.some((m) => m.userId === otherUserId)) return conversation;
    }
    const timestamp = nowIso();
    const conversation = conversationSchema.parse({
      id: newId("cnv"),
      kind: "direct",
      title: other.name.slice(0, 80),
      clubId: "",
      createdBy: a.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await store.insert("conversations", conversation as unknown as Record<string, unknown>);
    for (const [userId, userName, role] of [
      [a.id, a.name, "member"],
      [other.id, other.name, "member"],
    ] as const) {
      await store.insert("conversation_members", {
        conversationId: conversation.id,
        userId,
        userName: userName.slice(0, 120),
        role,
        lastReadAt: timestamp,
        joinedAt: timestamp,
      });
    }
    return conversation;
  },

  createGroup: async (
    creator: { id: string; name: string },
    input: { title: string; memberIds: string[] },
  ): Promise<Conversation> => {
    const parsed = z
      .object({ title: z.string().trim().min(1).max(80), memberIds: z.array(z.string()).max(MAX_GROUP_MEMBERS) })
      .parse(input);
    const unique = [...new Set(parsed.memberIds.filter((id) => id !== creator.id))];
    if (unique.length < 1) throw new MessageError("Add at least one other member.", 400);
    const users = unique.map((id) => activeUser(id));
    const timestamp = nowIso();
    const conversation = conversationSchema.parse({
      id: newId("cnv"),
      kind: "group",
      title: parsed.title,
      clubId: "",
      createdBy: creator.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await store.insert("conversations", conversation as unknown as Record<string, unknown>);
    await store.insert("conversation_members", {
      conversationId: conversation.id,
      userId: creator.id,
      userName: creator.name.slice(0, 120),
      role: "admin",
      lastReadAt: timestamp,
      joinedAt: timestamp,
    });
    for (const user of users) {
      await store.insert("conversation_members", {
        conversationId: conversation.id,
        userId: user.id,
        userName: user.name.slice(0, 120),
        role: "member",
        lastReadAt: timestamp,
        joinedAt: timestamp,
      });
      await notify(user.id, {
        kind: "message",
        title: "Added to a group",
        body: `${creator.name} added you to ${parsed.title}.`,
        link: "/messages",
      });
    }
    return conversation;
  },

  createClubChannel: async (
    creator: { id: string; name: string },
    input: { clubId: string; title: string },
  ): Promise<Conversation> => {
    const parsed = z
      .object({ clubId: z.string().trim().min(1).max(100), title: z.string().trim().min(1).max(80) })
      .parse(input);
    const existing = store.find<Conversation>(
      "conversations",
      (c) => c.kind === "club" && c.clubId === parsed.clubId,
    );
    if (existing) return existing;
    const timestamp = nowIso();
    const conversation = conversationSchema.parse({
      id: newId("cnv"),
      kind: "club",
      title: parsed.title,
      clubId: parsed.clubId,
      createdBy: creator.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await store.insert("conversations", conversation as unknown as Record<string, unknown>);
    return conversation;
  },

  listMessages: async (
    conversationId: string,
    userId: string,
    limit = 50,
  ): Promise<Message[]> => {
    await messages.assertAccess(conversationId, userId);
    return store
      .filter<Message>("messages", (m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(-Math.min(Math.max(limit, 1), 100));
  },

  postMessage: async (
    conversationId: string,
    sender: { id: string; name: string },
    body: string,
  ): Promise<Message> => {
    const conversation = await messages.assertAccess(conversationId, sender.id);
    const message = messageSchema.parse({
      id: newId("msg"),
      conversationId,
      senderId: sender.id,
      senderName: sender.name.slice(0, 120),
      body,
      createdAt: nowIso(),
    });
    await store.insert("messages", message as unknown as Record<string, unknown>);
    await touchConversation(conversationId);
    const recipients =
      conversation.kind === "club" && conversation.clubId
        ? campus
            .listMemberships(conversation.clubId)
            .filter((m) => m.status === "approved" && m.userId !== sender.id)
            .map((m) => m.userId)
        : store
            .filter<ConversationMember>(
              "conversation_members",
              (m) => m.conversationId === conversationId && m.userId !== sender.id,
            )
            .map((m) => m.userId);
    for (const userId of [...new Set(recipients)].slice(0, 200)) {
      await notify(userId, {
        kind: "message",
        title: conversation.kind === "direct" ? sender.name : conversation.title,
        body: message.body.slice(0, 160),
        link: "/messages",
      });
    }
    return message;
  },

  markRead: async (conversationId: string, userId: string): Promise<void> => {
    await messages.assertAccess(conversationId, userId);
    await store.update<ConversationMember>(
      "conversation_members",
      (m) => m.conversationId === conversationId && m.userId === userId,
      { lastReadAt: nowIso() },
    );
  },
};
