import { NextResponse } from "next/server";
import { audit } from "@/server/audit";
import { campus } from "@/server/campus";
import { limited, notFoundResponse, requireUser } from "@/server/guards";
import { findClub } from "../../../../../_lib/lookup";
import { canManageClub } from "../../../../../_lib/manage";

/** Delete a club resource (resource managers). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; resourceId: string }> },
) {
  const hit = limited(request, "manage:resources:delete", 30);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const { id, resourceId } = await params;
  const club = findClub(id);
  if (!club) return notFoundResponse("Club not found.");
  if (!canManageClub(guarded.serverUser, club.id, "club.resources.manage"))
    return NextResponse.json({ error: "Only club managers can delete resources." }, { status: 403 });
  const removed = await campus.deleteResource(club.id, resourceId);
  if (!removed) return notFoundResponse("Resource not found.");
  await audit({
    actorId: guarded.user.id,
    action: "club.resources.delete",
    targetType: "resource",
    targetId: resourceId,
  });
  return NextResponse.json({ ok: true });
}
