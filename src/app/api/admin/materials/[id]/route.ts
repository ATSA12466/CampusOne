import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { audit } from "@/server/audit";
import { adminRegistry } from "@/server/admin";
import {
  invalidInput,
  limited,
  notFoundResponse,
  readJson,
  requireAnyPermission,
} from "@/server/guards";

const MANAGE = ["academic.materials.manage", "platform.users.manage"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "admin:materials:update", 60);
  if (hit) return hit;
  const guarded = await requireAnyPermission([...MANAGE], request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const { id } = await params;
    const item = await adminRegistry.updateMaterial(id, parsed.body);
    if (!item) return notFoundResponse("Material not found.");
    await audit({
      actorId: guarded.user.id,
      action: "academic.materials.update",
      targetType: "material",
      targetId: item.id,
      detail: item.title,
    });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof ZodError) return invalidInput();
    throw error;
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "admin:materials:delete", 30);
  if (hit) return hit;
  const guarded = await requireAnyPermission([...MANAGE], request);
  if (guarded instanceof NextResponse) return guarded;
  const { id } = await params;
  const removed = await adminRegistry.deleteMaterial(id);
  if (!removed) return notFoundResponse("Material not found.");
  await audit({
    actorId: guarded.user.id,
    action: "academic.materials.delete",
    targetType: "material",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}
