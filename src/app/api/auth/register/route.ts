import { NextResponse } from "next/server";
import { AuthError, SESSION_TTL_DAYS, registerSchema, registerUser } from "@/server/auth";
import { audit } from "@/server/audit";
import { clientIp, limited, sessionCookie } from "@/server/guards";

export async function POST(request: Request) {
  const hit = limited(request, "auth:register", 20);
  if (hit) return hit;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Please provide a name, a valid email and a password of 8+ characters." },
      { status: 400 },
    );
  try {
    const { user, token } = await registerUser(parsed.data, {
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    await audit({ actorId: user.id, action: "auth.register", targetType: "user", targetId: user.id });
    return NextResponse.json(
      { user },
      { status: 201, headers: { "Set-Cookie": sessionCookie(token, SESSION_TTL_DAYS * 86_400) } },
    );
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
