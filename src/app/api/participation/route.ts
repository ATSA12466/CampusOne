import { NextResponse } from "next/server";
import { attendance } from "@/server/attendance";
import { myBadges } from "@/server/badges";
import { limited, requireUser } from "@/server/guards";

/** Participation history: attendance records + earned badges. */
export async function GET(request: Request) {
  const hit = limited(request, "participation:mine", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  return NextResponse.json({
    records: attendance.myRecords(guarded.user.id),
    badges: myBadges(guarded.user.id),
  });
}
