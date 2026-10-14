import { NextResponse } from "next/server";
import {
  AuthError,
  destroySession,
  issueMobileToken,
  mobileTokenSchema,
  parseBearerToken,
} from "@/server/auth";
import { audit } from "@/server/audit";
import { clientIp, currentSessionUser, limited } from "@/server/guards";

/**
 * Native mobile authentication. Issues an opaque session token (same sessions
 * table and RBAC as web cookies). The client must store it in secure storage
 * (Keychain/Keystore) and send `Authorization: Bearer <token>`.
 */
export async function POST(request: Request) {
  const hit = limited(request, "auth:token", 20);
  if (hit) return hit;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = mobileTokenSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  try {
    const { user, token, expiresAt } = await issueMobileToken(parsed.data, {
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    await audit({
      actorId: user.id,
      action: "auth.token.issue",
      targetType: "user",
      targetId: user.id,
    });
    return NextResponse.json({ token, expiresAt, user });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}

/** Validate the current session (cookie or Bearer) without issuing a token. */
export async function GET(request: Request) {
  const hit = limited(request, "auth:token:validate", 120);
  if (hit) return hit;
  const user = await currentSessionUser(request);
  if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  return NextResponse.json({ user });
}

/** Revoke the current session (cookie and/or Bearer token presented). */
export async function DELETE(request: Request) {
  const hit = limited(request, "auth:token:revoke", 60);
  if (hit) return hit;
  const user = await currentSessionUser(request);
  await destroySession(parseBearerToken(request.headers.get("authorization")));
  if (user)
    await audit({
      actorId: user.id,
      action: "auth.token.revoke",
      targetType: "user",
      targetId: user.id,
    });
  return NextResponse.json({ ok: true });
}
