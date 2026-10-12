import { NextResponse } from "next/server";
import { campus } from "@/server/campus";
import { limited, notFoundResponse, requireUser } from "@/server/guards";
import { findClub } from "../../../../_lib/lookup";
import { canManageClub } from "../../../../_lib/manage";

/** Club analytics from real records (viewers and up). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "manage:analytics", 60);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const { id } = await params;
  const club = findClub(id);
  if (!club) return notFoundResponse("Club not found.");
  if (!canManageClub(guarded.serverUser, club.id, "club.members.view"))
    return NextResponse.json({ error: "Only club managers can view analytics." }, { status: 403 });
  return NextResponse.json({ club, analytics: campus.analytics(club.id) });
}
