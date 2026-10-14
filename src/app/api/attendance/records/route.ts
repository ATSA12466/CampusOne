import { NextResponse } from "next/server";
import { attendance } from "@/server/attendance";
import { limited, requireUser } from "@/server/guards";

/** The signed-in student's own attendance history. */
export async function GET(request: Request) {
  const hit = limited(request, "attendance:records:mine", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const items = attendance.myRecords(guarded.user.id);
  return NextResponse.json({ items, total: items.length });
}
