import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import {
  invalidInput,
  limited,
  notFoundResponse,
  readJson,
  requirePermission,
} from "@/server/guards";
import { can } from "@/server/permissions";
import { adminRegistry } from "@/server/admin";

const patchSchema = z.object({
  status: z.enum(["active", "suspended"]).optional(),
  verifiedStudent: z.boolean().optional(),
  roles: z.array(z.string().min(1).max(40)).min(1).max(8).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "admin:users:update", 60);
  if (hit) return hit;
  const guarded = await requirePermission("platform.users.manage");
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = patchSchema.safeParse(parsed.body);
  if (!body.success) return invalidInput();
  if (body.data.roles && !can(guarded.serverUser, "platform.roles.manage"))
    return NextResponse.json(
      { error: "Role changes need the roles permission." },
      { status: 403 },
    );
  const { id } = await params;
  if (id === guarded.user.id && body.data.status === "suspended")
    return invalidInput("You cannot suspend your own account.");
  const updated = await adminRegistry.updateUser(id, body.data as { status?: "active" | "suspended"; verifiedStudent?: boolean; roles?: ("student" | "verified-student" | "club-member" | "club-executive" | "club-president" | "committee-member" | "src-representative" | "src-executive" | "src-admin" | "moderator" | "vendor" | "administrator" | "super-admin")[] });
  if (!updated) return notFoundResponse("User not found.");
  await audit({
    actorId: guarded.user.id,
    action: "platform.users.update",
    targetType: "user",
    targetId: id,
    detail: `${updated.name} · ${updated.status}`,
  });
  const { passwordHash: _hash, ...safe } = updated;
  return NextResponse.json({ item: safe });
}
