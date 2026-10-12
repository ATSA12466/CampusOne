import { NextResponse } from "next/server";
import { currentSessionUser, limited } from "@/server/guards";

export async function GET(request: Request) {
  const hit = limited(request, "auth:session", 120);
  if (hit) return hit;
  const user = await currentSessionUser();
  return NextResponse.json({ user });
}
