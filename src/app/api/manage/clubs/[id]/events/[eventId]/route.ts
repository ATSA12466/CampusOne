import { NextResponse } from "next/server";
import { audit } from "@/server/audit";
import { campus } from "@/server/campus";
import { limited, notFoundResponse, requireUser } from "@/server/guards";
import { findClub } from "../../../../../_lib/lookup";
import { canManageClub } from "../../../../../_lib/manage";

/** Cancel a club event (event managers). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const hit = limited(request, "manage:events:cancel", 30);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const { id, eventId } = await params;
  const club = findClub(id);
  if (!club) return notFoundResponse("Club not found.");
  if (!canManageClub(guarded.serverUser, club.id, "club.events.manage"))
    return NextResponse.json({ error: "Only event managers can cancel events." }, { status: 403 });
  const row = campus.getCampusEvent(eventId);
  if (!row || row.meta.clubId !== club.id) return notFoundResponse("Event not found.");
  await campus.cancelCampusEvent(eventId);
  await audit({
    actorId: guarded.user.id,
    action: "club.events.cancel",
    targetType: "event",
    targetId: eventId,
    detail: row.event.title,
  });
  return NextResponse.json({ ok: true });
}
