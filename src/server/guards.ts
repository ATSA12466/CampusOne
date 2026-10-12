// Next.js route-handler/page guards. Server-only: imports next/headers.
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, getServerUser, getSessionUser } from "./auth";
import { can, type Permission } from "./permissions";
import { rateLimit } from "./rate-limit";
import type { ServerUser, SessionUser } from "./types";

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim().slice(0, 80) ?? "unknown";
  return "unknown";
}

export function limited(request: Request, route: string, maxPerMinute: number): NextResponse | null {
  const result = rateLimit(`${route}:${clientIp(request)}`, maxPerMinute);
  if (!result.allowed)
    return NextResponse.json(
      { error: "Too many requests. Please slow down and retry." },
      { status: 429, headers: { "Retry-After": String(result.retryAfterSec) } },
    );
  return null;
}

export async function currentSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return getSessionUser(jar.get(SESSION_COOKIE)?.value);
}

export async function currentServerUser(): Promise<ServerUser | null> {
  const session = await currentSessionUser();
  if (!session) return null;
  return getServerUser(session.id);
}

export interface Guarded {
  user: SessionUser;
  serverUser: ServerUser;
}

export async function requireUser(): Promise<Guarded | NextResponse> {
  const session = await currentSessionUser();
  if (!session)
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const serverUser = await getServerUser(session.id);
  if (!serverUser)
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  return { user: session, serverUser };
}

export async function requirePermission(
  permission: Permission,
  scope?: { type: "global" | "club" | "event" | "user"; id?: string },
): Promise<Guarded | NextResponse> {
  const guarded = await requireUser();
  if (guarded instanceof NextResponse) return guarded;
  if (!can(guarded.serverUser, permission, scope))
    return NextResponse.json(
      { error: "You do not have permission to perform this action." },
      { status: 403 },
    );
  return guarded;
}

export function sessionCookie(token: string, maxAgeSec: number): string {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax;${secure} Max-Age=${maxAgeSec}`;
}

export function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax;${secure} Max-Age=0`;
}
