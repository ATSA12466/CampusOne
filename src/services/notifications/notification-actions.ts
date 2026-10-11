import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";
import { appConfig } from "@/config/app-config";
import { recordIdSchema } from "@/services/validation/owned-media.schema";
import { apiClient } from "@/services/api/client";
import { z } from "zod";
import type { ServiceOptions } from "@/types/service-contracts";
const owner = () => {
  const s = useAuthStore.getState();
  if (!s.user || !s.hydrated || s.source !== appConfig.dataSource)
    throw new Error("Sign in with the active source to read notifications.");
  return `${s.source}:${s.user.id}:${s.user.email}:${s.role}`;
};
export const notificationActions = {
  async read(ids: string[], options: ServiceOptions = {}) {
    const valid = z.array(recordIdSchema).max(200).parse(ids),
      expected = owner();
    options.signal?.throwIfAborted();
    if (appConfig.dataSource === "api") {
      await apiClient("/notifications/read", {
        method: "PUT",
        body: JSON.stringify({ ids: valid }),
        schema: z.object({ ok: z.literal(true) }),
        cache: "no-store",
        signal: options.signal
          ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)])
          : AbortSignal.timeout(10000),
      });
      options.signal?.throwIfAborted();
      if (owner() !== expected)
        throw new Error("The account changed. Refresh notifications.");
      return { persisted: true };
    }
    const state = useAppStore.getState();
    if (valid.some((id) => !state.notifications.some((n) => n.id === id)))
      throw new Error("An update is no longer available.");
    let persisted = true;
    try {
      useAppStore.setState({
        notifications: state.notifications.map((n) =>
          valid.includes(n.id) ? { ...n, read: true } : n,
        ),
      });
    } catch {
      persisted = false;
    }
    try {
      const stored: unknown = JSON.parse(
        localStorage.getItem("campusone-app") ?? "null",
      );
      const result = z
        .object({
          state: z.object({
            notifications: z.array(
              z.object({ id: recordIdSchema, read: z.boolean() }),
            ),
          }),
        })
        .safeParse(stored);
      persisted =
        persisted &&
        result.success &&
        valid.every((id) =>
          result.data.state.notifications.some((n) => n.id === id && n.read),
        );
    } catch {
      persisted = false;
    }
    if (
      owner() !== expected ||
      valid.some(
        (id) =>
          !useAppStore.getState().notifications.find((n) => n.id === id)?.read,
      )
    )
      throw new Error("Notification change could not be confirmed.");
    return { persisted };
  },
};
