import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import { attendance } from "@/server/attendance";
import {
  invalidInput,
  limited,
  notFoundResponse,
  readJson,
  requireUser,
} from "@/server/guards";
import { findEvent } from "../../../_lib/lookup";
import { canManageEvent } from "../../../_lib/manage";

const patchSchema = z.object({ status: z.enum(["closed", "revoked"]) });

function forbidden() {
  return NextResponse.json(
    { error: "Only authorised event managers can do this." },
    { status: 403 },
  );
}

/** Session detail + check-in list (managers only). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "attendance:session:get", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const { id } = await params;
  const session = attendance.getSession(id);
  if (!session) return notFoundResponse("Attendance session not found.");
  const event = findEvent(session.eventId);
  if (!event) return notFoundResponse("Event not found.");
  if (!canManageEvent(guarded.serverUser, event, "club.attendance.manage")) return forbidden();
  const checkins = attendance.sessionCheckins(session.id);
  return NextResponse.json({
    item: session,
    checkins,
    present: checkins.filter((c) => c.status === "present").length,
  });
}

/** Close or revoke a session (managers only). Revocation kills live QR codes. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "attendance:session:patch", 30);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = patchSchema.safeParse(parsed.body);
  if (!body.success) return invalidInput();
  const { id } = await params;
  const session = attendance.getSession(id);
  if (!session) return notFoundResponse("Attendance session not found.");
  const event = findEvent(session.eventId);
  if (!event) return notFoundResponse("Event not found.");
  if (!canManageEvent(guarded.serverUser, event, "club.attendance.manage")) return forbidden();
  const updated = await attendance.setSessionStatus(id, body.data.status);
  await audit({
    actorId: guarded.user.id,
    action: `attendance.session.${body.data.status}`,
    targetType: "attendance_session",
    targetId: id,
    detail: session.eventTitle,
  });
  return NextResponse.json({ item: updated });
}
