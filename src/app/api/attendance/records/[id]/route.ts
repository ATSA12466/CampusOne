import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import { attendance, type AttendanceRecord } from "@/server/attendance";
import {
  invalidInput,
  limited,
  notFoundResponse,
  readJson,
  requireUser,
} from "@/server/guards";
import { store } from "@/server/store";
import { findEvent } from "../../../_lib/lookup";
import { canManageEvent } from "../../../_lib/manage";

const patchSchema = z.object({
  status: z.enum(["present", "voided", "excused"]),
  reason: z.string().trim().min(3).max(300),
});

/** Auditable attendance correction (managers only; original row is kept). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "attendance:records:correct", 60);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = patchSchema.safeParse(parsed.body);
  if (!body.success) return invalidInput();
  const { id } = await params;
  const record = store.find<AttendanceRecord>("attendance_records", (r) => r.id === id);
  if (!record) return notFoundResponse("Attendance record not found.");
  const event = findEvent(record.eventId);
  if (!event) return notFoundResponse("Event not found.");
  if (!canManageEvent(guarded.serverUser, event, "club.attendance.manage"))
    return NextResponse.json(
      { error: "Only authorised event managers can do this." },
      { status: 403 },
    );
  const updated = await attendance.correctRecord(id, body.data, guarded.user.id);
  if (!updated) return notFoundResponse("Attendance record not found.");
  await audit({
    actorId: guarded.user.id,
    action: "attendance.record.correct",
    targetType: "attendance_record",
    targetId: id,
    detail: `${body.data.status}: ${body.data.reason}`,
  });
  return NextResponse.json({ item: updated });
}
