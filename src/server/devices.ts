// Node-safe push-device registry. Stores FCM tokens per user; actual push
// delivery requires the external Firebase project (see docs/MOBILE_RELEASE.md).
import { z } from "zod";
import { newId } from "./crypto";
import { store } from "./store";

export const deviceSchema = z.object({
  id: z.string().min(1).max(80),
  userId: z.string().min(1).max(80),
  platform: z.enum(["android", "ios", "web"]),
  token: z.string().trim().min(10).max(512),
  appVersion: z.string().trim().max(40).default(""),
  createdAt: z.string().datetime(),
  lastSeenAt: z.string().datetime(),
});

export type Device = z.infer<typeof deviceSchema>;

export const deviceInputSchema = deviceSchema.pick({ platform: true, token: true, appVersion: true });

export const devices = {
  listMine: (userId: string) =>
    store
      .filter<Device>("devices", (d) => d.userId === userId)
      .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt)),

  register: async (userId: string, input: unknown): Promise<Device> => {
    const parsed = deviceInputSchema.parse(input);
    const existing = store.find<Device>("devices", (d) => d.token === parsed.token);
    const timestamp = new Date().toISOString();
    if (existing) {
      const row = deviceSchema.parse({
        ...existing,
        userId,
        platform: parsed.platform,
        appVersion: parsed.appVersion,
        lastSeenAt: timestamp,
      });
      await store.update<Device>("devices", (d) => d.id === existing.id, row);
      return row;
    }
    const row = deviceSchema.parse({
      id: newId("dev"),
      userId,
      ...parsed,
      createdAt: timestamp,
      lastSeenAt: timestamp,
    });
    await store.insert("devices", row as unknown as Record<string, unknown>);
    return row;
  },

  revoke: (userId: string, id: string) =>
    store.remove<Device>("devices", (d) => d.id === id && d.userId === userId),
};
