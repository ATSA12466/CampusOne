import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { audit } from "@/server/audit";
import { AttendanceError, attendance } from "@/server/attendance";
import {
  invalidInput,
  limited,
  notFoundResponse,
  readJson,
  requireUser,
} from "@/server/guards";
import { findEvent } from "../../_lib/lookup";
import { canManageEvent } from "../../_lib/manage";

function forbidden() {
  return NextResponse.json(
    { error: "Only authorised event managers can do this." },
    { status: 403 },
  );
}

/** List check-in sessions for an event (managers only). */
export async function GET(request: Request) {
  const hit = limited(request, "attendance:sessions:list", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const eventId = new URL(request.url).searchParams.get("eventId") ?? "";
  const event = findEvent(eventId);
  if (!event) return notFoundResponse("Event not found.");
  if (!canManageEvent(guarded.serverUser, event, "club.attendance.manage")) return forbidden();
  return NextResponse.json({ items: attendance.listSessionsForEvent(event.id) });
}

/** Create a check-in session (managers only). */
export async function POST(request: Request) {
  const hit = limited(request, "attendance:sessions:create", 30);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const body = parsed.body as { eventId?: string; clubId?: string; clubName?: string };
    const event = findEvent(typeof body.eventId === "string" ? body.eventId : "");
    if (!event) return notFoundResponse("Event not found.");
    if (!canManageEvent(guarded.serverUser, event, "club.attendance.manage")) return forbidden();
    // Server snapshots the event title; club linkage comes from the event unless
    // the caller manages the claimed club (fixture events carry no club).
    let clubId = event.clubId;
    let clubName = "";
    if (!clubId && typeof body.clubId === "string" && body.clubId) {
      clubId = body.clubId.slice(0, 100);
      clubName = typeof body.clubName === "string" ? body.clubName.slice(0, 160) : "";
    }
    const session = await attendance.createSession(
      { ...(body as Record<string, unknown>), eventId: event.id, eventTitle: event.title, clubId, clubName },
      guarded.user.id,
    );
    await audit({
      actorId: guarded.user.id,
      action: "attendance.session.create",
      targetType: "attendance_session",
      targetId: session.id,
      detail: session.eventTitle,
    });
    return NextResponse.json({ item: session }, { status: 201 });
  } catch (error) {
    if (error instanceof AttendanceError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof ZodError) return invalidInput();
    throw error;
  }
}
