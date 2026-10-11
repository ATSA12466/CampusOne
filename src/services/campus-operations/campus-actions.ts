import { z } from "zod";
import { appConfig } from "@/config/app-config";
import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";
import { apiClient } from "@/services/api/client";
import { campusService } from "@/services";
import {
  campusId,
  requestInputSchema,
  campusActivitySchema,
} from "@/services/validation/campus-operations.schema";
import type { CampusActionService } from "@/types/campus-operations";
import type { ServiceOptions } from "@/types/service-contracts";
const deadline = (o: ServiceOptions = {}) =>
  o.signal
    ? AbortSignal.any([o.signal, AbortSignal.timeout(10000)])
    : AbortSignal.timeout(10000);
export function createCampusActions(
  source: "demo" | "api" = appConfig.dataSource,
): CampusActionService {
  const owner = () => {
    const s = useAuthStore.getState();
    if (!s.hydrated || !s.user || s.source !== source)
      throw new Error(
        "Sign in with the active source before changing campus activity.",
      );
    return `${s.source}:${s.user.id}:${s.user.email.toLowerCase()}:${s.role}`;
  };
  const check = (expected: string, o: ServiceOptions) => {
    o.signal?.throwIfAborted();
    if (owner() !== expected)
      throw new Error(
        "The account changed. Refresh publisher state; stopping a request cannot undo an accepted write.",
      );
  };
  const local = (change: () => void, verify: () => boolean) => {
    try {
      change();
    } catch {
      if (!verify()) throw new Error("The local change failed. Please retry.");
      return { persisted: false };
    }
    if (!verify()) throw new Error("The local change could not be verified.");
    try {
      const raw = localStorage.getItem("campusone-app");
      if (!raw) return { persisted: false };
      const saved = JSON.parse(raw).state;
      return {
        persisted:
          JSON.stringify(saved.bookmarks) ===
            JSON.stringify(useAppStore.getState().bookmarks) &&
          JSON.stringify(saved.srcRequests) ===
            JSON.stringify(useAppStore.getState().srcRequests),
      };
    } catch {
      return { persisted: false };
    }
  };
  return {
    source,
    async activity(o = {}) {
      const expected = owner();
      o.signal?.throwIfAborted();
      const result =
        source === "api"
          ? await apiClient("/campus/activity", {
              schema: campusActivitySchema,
              signal: deadline(o),
              cache: "no-store",
            })
          : {
              savedAnnouncementIds: useAppStore
                .getState()
                .bookmarks.filter((b) => b.entityType === "announcement")
                .map((b) => b.entityId),
              requests: useAppStore.getState().srcRequests,
            };
      check(expected, o);
      return campusActivitySchema.parse(result);
    },
    async saveAnnouncement(id, saved, o = {}) {
      campusId.parse(id);
      const expected = owner();
      o.signal?.throwIfAborted();
      if (source === "api") {
        await apiClient(`/announcements/${encodeURIComponent(id)}/saved`, {
          method: saved ? "PUT" : "DELETE",
          schema: z.object({ ok: z.literal(true) }),
          signal: deadline(o),
          cache: "no-store",
        });
        check(expected, o);
        return { persisted: true };
      }
      const item = await campusService.get("announcements", id, {
        ...o,
        signal: deadline(o),
      });
      check(expected, o);
      if (!item || item.id !== id)
        throw new Error("This announcement is no longer available.");
      return local(
        () =>
          useAppStore
            .getState()
            .setBookmark(
              {
                id: crypto.randomUUID(),
                entityId: id,
                entityType: "announcement",
              },
              saved,
            ),
        () =>
          useAppStore
            .getState()
            .bookmarks.some(
              (b) => b.entityType === "announcement" && b.entityId === id,
            ) === saved,
      );
    },
    async submitRequest(input, o = {}) {
      const payload = requestInputSchema.parse(input),
        expected = owner();
      o.signal?.throwIfAborted();
      if (source === "api") {
        await apiClient("/src-office/requests", {
          method: "POST",
          body: JSON.stringify(payload),
          schema: z.object({ ok: z.literal(true) }),
          signal: deadline(o),
          cache: "no-store",
        });
        check(expected, o);
        return { persisted: true };
      }
      if (useAppStore.getState().srcRequests.length >= 200)
        throw new Error("Your request collection is full.");
      check(expected, o);
      const before = new Set(
        useAppStore.getState().srcRequests.map((r) => r.id),
      );
      return local(
        () => useAppStore.getState().submitSrcRequest(payload),
        () =>
          useAppStore
            .getState()
            .srcRequests.some(
              (r) =>
                !before.has(r.id) &&
                r.title === payload.title &&
                r.description === payload.description,
            ),
      );
    },
  };
}
export const campusActions = createCampusActions();
