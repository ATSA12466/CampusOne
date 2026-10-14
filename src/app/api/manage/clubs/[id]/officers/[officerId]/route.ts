import { NextResponse } from "next/server";
import { audit } from "@/server/audit";
import { campus } from "@/server/campus";
import { limited, notFoundResponse, requireUser } from "@/server/guards";
import { findClub } from "../../../../../_lib/lookup";
import { canManageClub } from "../../../../../_lib/manage";

/** End an officer's tenure (member managers). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; officerId: string }> },
) {
  const hit = limited(request, "manage:officers:end", 30);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const { id, officerId } = await params;
  const club = findClub(id);
  if (!club) return notFoundResponse("Club not found.");
  if (!canManageClub(guarded.serverUser, club.id, "club.members.manage"))
    return NextResponse.json(
      { error: "Only club managers can end tenures." },
      { status: 403 },
    );
  const updated = await campus.endTenure(club.id, officerId);
  if (!updated) return notFoundResponse("Officer not found.");
  await audit({
    actorId: guarded.user.id,
    action: "club.officers.end",
    targetType: "officer",
    targetId: officerId,
    detail: `${updated.name} · ${updated.position}`,
  });
  return NextResponse.json({ item: updated });
}
