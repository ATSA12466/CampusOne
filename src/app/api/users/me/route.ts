import { NextResponse } from "next/server";
import { profilePatchSchema, updateProfile } from "@/server/auth";
import { audit } from "@/server/audit";
import { limited, requireUser } from "@/server/guards";

export async function GET(request: Request) {
  const hit = limited(request, "users:me", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  return NextResponse.json({ user: guarded.user });
}

export async function PATCH(request: Request) {
  const hit = limited(request, "users:me:patch", 30);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = profilePatchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Profile details are invalid." }, { status: 400 });
  const user = await updateProfile(guarded.user.id, parsed.data);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  await audit({
    actorId: user.id,
    action: "users.profile.update",
    targetType: "user",
    targetId: user.id,
  });
  return NextResponse.json({ user });
}
