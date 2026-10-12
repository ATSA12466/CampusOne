import { NextResponse } from "next/server";
import { AuthError, SESSION_TTL_DAYS, loginSchema, loginUser } from "@/server/auth";
import { audit } from "@/server/audit";
import { clientIp, limited, sessionCookie } from "@/server/guards";

export async function POST(request: Request) {
  const hit = limited(request, "auth:sign-in", 20);
  if (hit) return hit;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  try {
    const { user, token } = await loginUser(parsed.data, {
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    await audit({ actorId: user.id, action: "auth.sign-in", targetType: "user", targetId: user.id });
    return NextResponse.json(
      { user },
      { headers: { "Set-Cookie": sessionCookie(token, SESSION_TTL_DAYS * 86_400) } },
    );
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
