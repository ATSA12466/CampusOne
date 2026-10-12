import { NextResponse } from "next/server";
import { ensureBadgeDefinitions, myBadges } from "@/server/badges";
import { limited, requireUser } from "@/server/guards";

/** The signed-in student's earned badges (with definitions joined). */
export async function GET(request: Request) {
  const hit = limited(request, "badges:mine", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  await ensureBadgeDefinitions();
  const items = myBadges(guarded.user.id);
  return NextResponse.json({ items, total: items.length });
}
