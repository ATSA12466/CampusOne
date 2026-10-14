import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { audit } from "@/server/audit";
import { campus } from "@/server/campus";
import { invalidInput, limited, notFoundResponse, readJson, requireUser } from "@/server/guards";
import { findClub } from "../../../../_lib/lookup";
import { canManageClub } from "../../../../_lib/manage";

/** Server-created events for a club (viewers and up). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "manage:events:list", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const { id } = await params;
  const club = findClub(id);
  if (!club) return notFoundResponse("Club not found.");
  if (!canManageClub(guarded.serverUser, club.id, "club.members.view"))
    return NextResponse.json({ error: "Only club managers can view events." }, { status: 403 });
  const items = campus
    .listCampusEvents()
    .filter((row) => row.meta.clubId === club.id)
    .map((row) => row.event);
  return NextResponse.json({ club, items, total: items.length });
}

/** Publish a club event (event managers). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "manage:events:create", 30);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const { id } = await params;
  const club = findClub(id);
  if (!club) return notFoundResponse("Club not found.");
  if (!canManageClub(guarded.serverUser, club.id, "club.events.manage"))
    return NextResponse.json({ error: "Only event managers can publish events." }, { status: 403 });
  try {
    const event = await campus.createCampusEvent(
      { ...(parsed.body as Record<string, unknown>), clubId: club.id },
      { id: guarded.user.id, name: guarded.user.name },
    );
    await audit({
      actorId: guarded.user.id,
      action: "club.events.publish",
      targetType: "event",
      targetId: event.id,
      detail: event.title,
    });
    return NextResponse.json({ item: event }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return invalidInput();
    throw error;
  }
}
