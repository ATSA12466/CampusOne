import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { audit } from "@/server/audit";
import { invalidInput, limited, readJson, requireAnyPermission } from "@/server/guards";
import { registry } from "@/server/registry";

const PUBLISH = ["src.content.publish", "platform.users.manage"] as const;

export async function GET(request: Request) {
  const hit = limited(request, "src:profiles:list", 120);
  if (hit) return hit;
  // Active executive profiles are directory information; full list needs publish rights.
  const guarded = await requireAnyPermission([...PUBLISH], request);
  if (guarded instanceof NextResponse)
    return NextResponse.json({ items: registry.activeProfiles() });
  return NextResponse.json({ items: registry.listProfiles() });
}

export async function POST(request: Request) {
  const hit = limited(request, "src:profiles:create", 30);
  if (hit) return hit;
  const guarded = await requireAnyPermission([...PUBLISH], request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const item = await registry.saveProfile(parsed.body);
    await audit({
      actorId: guarded.user.id,
      action: "src.profiles.create",
      targetType: "src-profile",
      targetId: item.id,
      detail: `${item.name} · ${item.position}`,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return invalidInput();
    throw error;
  }
}
