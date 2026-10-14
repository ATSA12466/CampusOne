// Node-safe server notification feed. Written only by real server actions
// (membership decisions, badge awards, messages, corrections) — never fixtures.
import { z } from "zod";
import { newId } from "./crypto";
import { store } from "./store";

export const notificationKinds = [
  "membership",
  "badge",
  "attendance",
  "message",
  "announcement",
  "rsvp",
  "system",
] as const;

export const notificationSchema = z.object({
  id: z.string().min(1).max(80),
  userId: z.string().min(1).max(80),
  kind: z.enum(notificationKinds),
  title: z.string().trim().min(1).max(140),
  body: z.string().trim().min(1).max(500),
  link: z.string().trim().max(300).default(""),
  readAt: z.string().max(40).default(""),
  createdAt: z.string().datetime(),
});

export type Notification = z.infer<typeof notificationSchema>;

const MAX_PER_USER = 100;

export async function notify(
  userId: string,
  input: { kind: (typeof notificationKinds)[number]; title: string; body: string; link?: string },
): Promise<Notification> {
  const row = notificationSchema.parse({
    id: newId("ntf"),
    userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    link: input.link ?? "",
    readAt: "",
    createdAt: new Date().toISOString(),
  });
  await store.insert("notifications", row as unknown as Record<string, unknown>);
  const mine = store
    .filter<Notification>("notifications", (n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (mine.length > MAX_PER_USER) {
    const stale = new Set(mine.slice(MAX_PER_USER).map((n) => n.id));
    await store.remove<Notification>("notifications", (n) => stale.has(n.id));
  }
  return row;
}

export function listNotifications(userId: string, limit = 50): Notification[] {
  return store
    .filter<Notification>("notifications", (n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, Math.min(Math.max(limit, 1), 100));
}

export function unreadCount(userId: string): number {
  return store.filter<Notification>(
    "notifications",
    (n) => n.userId === userId && !n.readAt,
  ).length;
}

export async function markNotificationsRead(userId: string, ids: string[] | "all"): Promise<number> {
  const wanted = ids === "all" ? null : new Set(ids);
  const now = new Date().toISOString();
  return store.update<Notification>(
    "notifications",
    (n) => n.userId === userId && !n.readAt && (!wanted || wanted.has(n.id)),
    { readAt: now },
  );
}
