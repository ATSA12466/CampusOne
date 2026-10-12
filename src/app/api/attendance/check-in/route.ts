import { NextResponse } from "next/server";
import { z } from "zod";
import { AttendanceError, attendance } from "@/server/attendance";
import { audit } from "@/server/audit";
import { invalidInput, limited, readJson, requireUser } from "@/server/guards";

const bodySchema = z.object({ code: z.string().trim().min(8).max(300) });

/** Validate a scanned QR code and record attendance (signed-in students). */
export async function POST(request: Request) {
  const hit = limited(request, "attendance:check-in", 60);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = bodySchema.safeParse(parsed.body);
  if (!body.success) return invalidInput("That QR code is not valid.");
  try {
    const result = await attendance.checkIn(body.data.code, {
      id: guarded.user.id,
      name: guarded.user.name,
    });
    if (!result.duplicate)
      await audit({
        actorId: guarded.user.id,
        action: "attendance.check-in",
        targetType: "attendance_record",
        targetId: result.record.id,
        detail: result.session.eventTitle,
      });
    return NextResponse.json({
      record: result.record,
      session: {
        id: result.session.id,
        eventTitle: result.session.eventTitle,
        clubName: result.session.clubName,
      },
      duplicate: result.duplicate,
      badges: result.badges,
    });
  } catch (error) {
    if (error instanceof AttendanceError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    throw error;
  }
}
