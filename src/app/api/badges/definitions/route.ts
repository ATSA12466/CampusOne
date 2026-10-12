import { NextResponse } from "next/server";
import { ensureBadgeDefinitions } from "@/server/badges";
import { limited } from "@/server/guards";

/** Public badge catalogue (rules and thresholds). */
export async function GET(request: Request) {
  const hit = limited(request, "badges:definitions", 120);
  if (hit) return hit;
  const items = await ensureBadgeDefinitions();
  return NextResponse.json({ items, total: items.length });
}
