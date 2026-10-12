import { NextResponse } from "next/server";
import { campus } from "@/server/campus";
import { limited, notFoundResponse, requireUser } from "@/server/guards";
import { findClub } from "../../../../_lib/lookup";
import { canManageClub } from "../../../../_lib/manage";

/** Club membership roster (viewers and up). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "manage:members", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const { id } = await params;
  const club = findClub(id);
  if (!club) return notFoundResponse("Club not found.");
  if (!canManageClub(guarded.serverUser, club.id, "club.members.view"))
    return NextResponse.json(
      { error: "Only club managers can view members." },
      { status: 403 },
    );
  const items = campus.listMemberships(club.id);
  return NextResponse.json({ club, items, total: items.length });
}
