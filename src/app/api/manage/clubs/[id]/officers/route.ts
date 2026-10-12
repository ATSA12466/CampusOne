import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { audit } from "@/server/audit";
import { campus } from "@/server/campus";
import { invalidInput, limited, notFoundResponse, readJson, requireUser } from "@/server/guards";
import { findClub } from "../../../../_lib/lookup";
import { canManageClub } from "../../../../_lib/manage";

/** Club officers (viewers and up). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "manage:officers:list", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const { id } = await params;
  const club = findClub(id);
  if (!club) return notFoundResponse("Club not found.");
  if (!canManageClub(guarded.serverUser, club.id, "club.members.view"))
    return NextResponse.json({ error: "Only club managers can view officers." }, { status: 403 });
  const items = campus.listOfficers(club.id);
  return NextResponse.json({ club, items, total: items.length });
}

/** Appoint an officer (member managers). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "manage:officers:add", 30);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const { id } = await params;
  const club = findClub(id);
  if (!club) return notFoundResponse("Club not found.");
  if (!canManageClub(guarded.serverUser, club.id, "club.members.manage"))
    return NextResponse.json({ error: "Only club managers can appoint officers." }, { status: 403 });
  try {
    const item = await campus.addOfficer(club.id, parsed.body, guarded.user.id);
    await audit({
      actorId: guarded.user.id,
      action: "club.officers.appoint",
      targetType: "officer",
      targetId: item.id,
      detail: `${item.name} · ${item.position}`,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return invalidInput();
    throw error;
  }
}
