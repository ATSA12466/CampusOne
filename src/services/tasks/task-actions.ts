import { z } from "zod";
import { appConfig } from "@/config/app-config";
import { useAppStore } from "@/stores/app-store";
import { serviceOwner } from "@/lib/auth/service-owner";
import { apiClient } from "@/services/api/client";
import { taskRecordSchema } from "@/services/validation/task.schema";
import { recordIdSchema } from "@/services/validation/owned-media.schema";
import type { TaskItem } from "@/types/productivity";
import type { ServiceOptions } from "@/types/service-contracts";
const rows = z
    .array(taskRecordSchema)
    .max(200)
    .refine(
      (items) => new Set(items.map((i) => i.id)).size === items.length,
      "Task IDs must be unique.",
    ),
  ack = z.object({ ok: z.literal(true) });
const signal = (o: ServiceOptions) =>
  o.signal
    ? AbortSignal.any([o.signal, AbortSignal.timeout(10000)])
    : AbortSignal.timeout(10000);
function confirm(expected: string, o: ServiceOptions) {
  o.signal?.throwIfAborted();
  if (serviceOwner() !== expected)
    throw new Error("The account changed. Refresh your private tasks.");
}
function durable(id: string, item?: TaskItem) {
  try {
    const data = z
      .object({ state: z.object({ tasks: rows }) })
      .parse(JSON.parse(localStorage.getItem("campusone-app") ?? "null"));
    const stored = data.state.tasks.find((t) => t.id === id);
    return item ? JSON.stringify(stored) === JSON.stringify(item) : !stored;
  } catch {
    return false;
  }
}
export const taskActions = {
  async list(o: ServiceOptions = {}) {
    const expected = serviceOwner();
    o.signal?.throwIfAborted();
    const items =
      appConfig.dataSource === "demo"
        ? rows.parse(useAppStore.getState().tasks)
        : await apiClient("/tasks", {
            schema: rows,
            signal: signal(o),
            cache: "no-store",
          });
    confirm(expected, o);
    return { items, total: items.length };
  },
  async put(input: TaskItem, o: ServiceOptions = {}) {
    const expected = serviceOwner(),
      item = taskRecordSchema.parse(input);
    o.signal?.throwIfAborted();
    if (appConfig.dataSource === "api") {
      await apiClient(`/tasks/${encodeURIComponent(item.id)}`, {
        method: "PUT",
        body: JSON.stringify(item),
        schema: ack,
        signal: signal(o),
        cache: "no-store",
      });
      confirm(expected, o);
      return { persisted: true };
    }
    const current = rows.parse(useAppStore.getState().tasks),
      next = [item, ...current.filter((t) => t.id !== item.id)];
    if (next.length > 200)
      throw new Error(
        "Your task list is full. Remove older tasks before adding more.",
      );
    confirm(expected, o);
    let persisted = true;
    try {
      useAppStore.setState({ tasks: next });
    } catch {
      persisted = false;
    }
    confirm(expected, o);
    if (
      JSON.stringify(
        useAppStore.getState().tasks.find((t) => t.id === item.id),
      ) !== JSON.stringify(item)
    )
      throw new Error("The task could not be confirmed.");
    return { persisted: persisted && durable(item.id, item) };
  },
  async remove(id: string, o: ServiceOptions = {}) {
    recordIdSchema.parse(id);
    const expected = serviceOwner();
    o.signal?.throwIfAborted();
    if (appConfig.dataSource === "api") {
      await apiClient(`/tasks/${encodeURIComponent(id)}`, {
        method: "DELETE",
        schema: ack,
        signal: signal(o),
        cache: "no-store",
      });
      confirm(expected, o);
      return { persisted: true };
    }
    const next = rows
      .parse(useAppStore.getState().tasks)
      .filter((t) => t.id !== id);
    let persisted = true;
    confirm(expected, o);
    try {
      useAppStore.setState({ tasks: next });
    } catch {
      persisted = false;
    }
    confirm(expected, o);
    if (useAppStore.getState().tasks.some((t) => t.id === id))
      throw new Error("The task deletion could not be confirmed.");
    return { persisted: persisted && durable(id) };
  },
};
