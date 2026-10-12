import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { audit } from "@/server/audit";
import {
  invalidInput,
  limited,
  notFoundResponse,
  readJson,
  requireAnyPermission,
} from "@/server/guards";
import { registry } from "@/server/registry";

const PUBLISH = ["src.content.publish", "announcements.publish", "platform.users.manage"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "src:announcements:update", 60);
  if (hit) return hit;
  const guarded = await requireAnyPermission([...PUBLISH], request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const { id } = await params;
    const item = await registry.updateAnnouncement(id, parsed.body);
    if (!item) return notFoundResponse("Announcement not found.");
    await audit({
      actorId: guarded.user.id,
      action: "src.announcements.update",
      targetType: "announcement",
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
  const hit = limited(request, "src:announcements:delete", 30);
  if (hit) return hit;
  const guarded = await requireAnyPermission([...PUBLISH], request);
  if (guarded instanceof NextResponse) return guarded;
  const { id } = await params;
  const removed = await registry.deleteAnnouncement(id);
  if (!removed) return notFoundResponse("Announcement not found.");
  await audit({
    actorId: guarded.user.id,
    action: "src.announcements.delete",
    targetType: "announcement",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}
