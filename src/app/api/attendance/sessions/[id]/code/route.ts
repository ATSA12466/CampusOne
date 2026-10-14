import { NextResponse } from "next/server";
import { AttendanceError, attendance, mintSessionCode } from "@/server/attendance";
import { limited, notFoundResponse, requireUser } from "@/server/guards";
import { findEvent } from "../../../../_lib/lookup";
import { canManageEvent } from "../../../../_lib/manage";

/** Mint the currently-displayable QR payload (managers only, poll per slot). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "attendance:code", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const { id } = await params;
  const session = attendance.getSession(id);
  if (!session) return notFoundResponse("Attendance session not found.");
  const event = findEvent(session.eventId);
  if (!event) return notFoundResponse("Event not found.");
  if (!canManageEvent(guarded.serverUser, event, "club.attendance.manage"))
    return NextResponse.json(
      { error: "Only authorised event managers can do this." },
      { status: 403 },
    );
  try {
    return NextResponse.json(await mintSessionCode(id));
  } catch (error) {
    if (error instanceof AttendanceError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
