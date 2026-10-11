import { appConfig } from "@/config/app-config";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/services/api/client";
import { z } from "zod";
import {
  workspaceSchemas,
  recordIdSchema,
} from "@/services/validation/workspace.schema";
import {
  privateWorkspaceKey,
  readWorkspace,
  writeWorkspace,
} from "@/lib/workspace/storage";
import type {
  WorkspaceService,
  WorkspaceCollection,
  WorkspaceMap,
} from "@/types/workspace";
import type { ServiceOptions } from "@/types/service-contracts";
const owner = (expected: "demo" | "api") => {
  const { user, source, hydrated } = useAuthStore.getState();
  if (!user || !hydrated || source !== expected)
    throw new Error(
      "Sign in with the active source to use your private workspace.",
    );
  return privateWorkspaceKey(source, user)!;
};
const signal = (o: ServiceOptions = {}) =>
  o.signal
    ? AbortSignal.any([o.signal, AbortSignal.timeout(10000)])
    : AbortSignal.timeout(10000);
function local<K extends WorkspaceCollection>(
  collection: K,
  key: string,
): WorkspaceMap[K][] {
  return z
    .array(workspaceSchemas[collection])
    .max(200)
    .parse(readWorkspace(`${key}:${collection}`)) as WorkspaceMap[K][];
}
export function createWorkspaceService(
  source: "demo" | "api" = appConfig.dataSource,
): WorkspaceService {
  return {
    source,
    async list(collection, options = {}) {
      options.signal?.throwIfAborted();
      const key = owner(source);
      const result =
        source === "api"
          ? await apiClient(`/workspace/${collection}`, {
              schema: z.array(workspaceSchemas[collection]).max(200),
              signal: signal(options),
              cache: "no-store",
            })
          : local(collection, key);
      options.signal?.throwIfAborted();
      if (owner(source) !== key)
        throw new Error("The account changed. Please retry.");
      return result as WorkspaceMap[typeof collection][];
    },
    async put(collection, input, options = {}) {
      options.signal?.throwIfAborted();
      const key = owner(source),
        item = workspaceSchemas[collection].parse(input);
      if (source === "api") {
        await apiClient(
          `/workspace/${collection}/${encodeURIComponent(item.id)}`,
          {
            method: "PUT",
            body: JSON.stringify(item),
            schema: z.object({ ok: z.literal(true) }),
            signal: signal(options),
            cache: "no-store",
          },
        );
        return { persisted: true };
      }
      const rows = local(collection, key),
        next = [item, ...rows.filter((r) => r.id !== item.id)].slice(0, 200);
      options.signal?.throwIfAborted();
      if (owner(source) !== key)
        throw new Error("The account changed. No local record was written.");
      return { persisted: writeWorkspace(`${key}:${collection}`, next) };
    },
    async remove(collection, id, options = {}) {
      recordIdSchema.parse(id);
      options.signal?.throwIfAborted();
      const key = owner(source);
      if (source === "api") {
        await apiClient(`/workspace/${collection}/${encodeURIComponent(id)}`, {
          method: "DELETE",
          schema: z.object({ ok: z.literal(true) }),
          signal: signal(options),
          cache: "no-store",
        });
        return { persisted: true };
      }
      const next = local(collection, key).filter((item) => item.id !== id);
      options.signal?.throwIfAborted();
      if (owner(source) !== key) throw new Error("The account changed.");
      return { persisted: writeWorkspace(`${key}:${collection}`, next) };
    },
  };
}
export const workspaceService = createWorkspaceService();
