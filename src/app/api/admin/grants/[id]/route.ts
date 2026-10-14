import { NextResponse } from "next/server";
import { audit } from "@/server/audit";
import { limited, notFoundResponse, requirePermission } from "@/server/guards";
import type { Grant } from "@/server/permissions";
import { store } from "@/server/store";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "admin:grants:revoke", 60);
  if (hit) return hit;
  const guarded = await requirePermission("platform.roles.manage", undefined, request);
  if (guarded instanceof NextResponse) return guarded;
  const { id } = await params;
  const existing = store.find<Grant>("grants", (g) => g.id === id);
  if (!existing || existing.revokedAt) return notFoundResponse("Active grant not found.");
  await store.update<Grant>("grants", (g) => g.id === id, {
    revokedAt: new Date().toISOString(),
  });
  await audit({
    actorId: guarded.user.id,
    action: "platform.grants.revoke",
    targetType: "grant",
    targetId: id,
    detail: existing.permission,
  });
  return NextResponse.json({ ok: true });
}
