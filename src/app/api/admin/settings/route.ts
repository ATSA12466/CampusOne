import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import { KNOWN_SETTINGS, adminRegistry } from "@/server/admin";
import { invalidInput, limited, readJson, requirePermission } from "@/server/guards";

const patchSchema = z.object({
  key: z.enum(KNOWN_SETTINGS),
  value: z.string().max(2000),
});

export async function GET(request: Request) {
  const hit = limited(request, "admin:settings:get", 120);
  if (hit) return hit;
  const guarded = await requirePermission("platform.settings.manage", undefined, request);
  if (guarded instanceof NextResponse) return guarded;
  return NextResponse.json({ settings: adminRegistry.getSettings(), known: KNOWN_SETTINGS });
}

export async function PATCH(request: Request) {
  const hit = limited(request, "admin:settings:save", 30);
  if (hit) return hit;
  const guarded = await requirePermission("platform.settings.manage", undefined, request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = patchSchema.safeParse(parsed.body);
  if (!body.success) return invalidInput();
  await adminRegistry.saveSetting(body.data.key, body.data.value, guarded.user.id);
  await audit({
    actorId: guarded.user.id,
    action: "platform.settings.save",
    targetType: "setting",
    targetId: body.data.key,
  });
  return NextResponse.json({ settings: adminRegistry.getSettings() });
}
