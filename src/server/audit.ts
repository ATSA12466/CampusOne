// Node-safe audit log writer (append-only; no delete API exposed).
import { newId } from "./crypto";
import { store } from "./store";

export async function audit(
  entry: {
    actorId: string | null;
    action: string;
    targetType: string;
    targetId: string;
    detail?: string;
    ip?: string;
  },
): Promise<void> {
  await store.insert("audit", {
    id: newId("a"),
    at: new Date().toISOString(),
    actorId: entry.actorId,
    action: entry.action.slice(0, 120),
    targetType: entry.targetType.slice(0, 60),
    targetId: entry.targetId.slice(0, 120),
    ...(entry.detail ? { detail: entry.detail.slice(0, 500) } : {}),
    ...(entry.ip ? { ip: entry.ip.slice(0, 80) } : {}),
  });
}
