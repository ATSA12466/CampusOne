// Next.js route-handler/page guards. Server-only: imports next/headers.
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, getServerUser, getSessionUser, parseBearerToken } from "./auth";
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

export async function currentSessionUser(request?: Request): Promise<SessionUser | null> {
  const jar = await cookies();
  const fromCookie = await getSessionUser(jar.get(SESSION_COOKIE)?.value);
  if (fromCookie) return fromCookie;
  // Native mobile clients authenticate with a Bearer session token (same table).
  if (request) return getSessionUser(parseBearerToken(request.headers.get("authorization")));
  return null;
}

export async function currentServerUser(request?: Request): Promise<ServerUser | null> {
  const session = await currentSessionUser(request);
  if (!session) return null;
  return getServerUser(session.id);
}

export interface Guarded {
  user: SessionUser;
  serverUser: ServerUser;
}

export async function requireUser(request?: Request): Promise<Guarded | NextResponse> {
  const session = await currentSessionUser(request);
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
  request?: Request,
): Promise<Guarded | NextResponse> {
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  if (!can(guarded.serverUser, permission, scope))
    return NextResponse.json(
      { error: "You do not have permission to perform this action." },
      { status: 403 },
    );
  return guarded;
}

/** Passes when the caller holds ANY of the listed global permissions. */
export async function requireAnyPermission(
  candidates: readonly Permission[],
  request?: Request,
): Promise<Guarded | NextResponse> {
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  if (!candidates.some((permission) => can(guarded.serverUser, permission)))
    return NextResponse.json(
      { error: "You do not have permission to perform this action." },
      { status: 403 },
    );
  return guarded;
}

export async function readJson(
  request: Request,
): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid request body." }, { status: 400 }),
    };
  }
}

export function invalidInput(message = "The submitted details are invalid."): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFoundResponse(message = "Not found."): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function sessionCookie(token: string, maxAgeSec: number): string {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax;${secure} Max-Age=${maxAgeSec}`;
}

export function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax;${secure} Max-Age=0`;
}
