import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, destroySession } from "@/server/auth";
import { audit } from "@/server/audit";
import { currentSessionUser, limited } from "@/server/guards";
import { clearSessionCookie } from "@/server/guards";

export async function POST(request: Request) {
  const hit = limited(request, "auth:sign-out", 60);
  if (hit) return hit;
  const user = await currentSessionUser();
  const jar = await cookies();
  await destroySession(jar.get(SESSION_COOKIE)?.value);
  if (user)
    await audit({ actorId: user.id, action: "auth.sign-out", targetType: "user", targetId: user.id });
  return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
}
