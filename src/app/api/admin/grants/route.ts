import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import { newId } from "@/server/crypto";
import {
  invalidInput,
  limited,
  readJson,
  requirePermission,
} from "@/server/guards";
import { grantSchema, permissionSchema } from "@/server/permissions";
import { store } from "@/server/store";

const createSchema = z.object({
  userId: z.string().min(1).max(80),
  permission: permissionSchema,
  scopeType: z.enum(["global", "club", "event", "user"]),
  scopeId: z.string().max(80).nullable().default(null),
  expiresAt: z.string().datetime().nullable().default(null),
});

export async function GET(request: Request) {
  const hit = limited(request, "admin:grants:list", 120);
  if (hit) return hit;
  const guarded = await requirePermission("platform.roles.manage", undefined, request);
  if (guarded instanceof NextResponse) return guarded;
  const userId = new URL(request.url).searchParams.get("userId") ?? undefined;
  const items = store
    .filter<z.infer<typeof grantSchema>>("grants", (g) => !userId || g.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 200);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const hit = limited(request, "admin:grants:create", 30);
  if (hit) return hit;
  const guarded = await requirePermission("platform.roles.manage", undefined, request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = createSchema.safeParse(parsed.body);
  if (!body.success) return invalidInput();
  if (body.data.scopeType !== "global" && !body.data.scopeId)
    return invalidInput("Scoped grants need a scope id (e.g. the club id).");
  const grant = grantSchema.parse({
    ...body.data,
    id: newId("g"),
    grantedBy: guarded.user.id,
    createdAt: new Date().toISOString(),
    revokedAt: null,
  });
  await store.insert("grants", grant);
  await audit({
    actorId: guarded.user.id,
    action: "platform.grants.create",
    targetType: "grant",
    targetId: grant.id,
    detail: `${grant.permission} · ${grant.scopeType}${grant.scopeId ? `:${grant.scopeId}` : ""}`,
  });
  return NextResponse.json({ item: grant }, { status: 201 });
}
