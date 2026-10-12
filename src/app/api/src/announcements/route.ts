import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { audit } from "@/server/audit";
import { invalidInput, limited, readJson, requireAnyPermission } from "@/server/guards";
import { registry } from "@/server/registry";

const PUBLISH = ["src.content.publish", "announcements.publish", "platform.users.manage"] as const;

export async function GET(request: Request) {
  const hit = limited(request, "src:announcements:list", 120);
  if (hit) return hit;
  const guarded = await requireAnyPermission([...PUBLISH]);
  if (guarded instanceof NextResponse) return guarded;
  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  return NextResponse.json({ items: registry.listAnnouncements(status) });
}

export async function POST(request: Request) {
  const hit = limited(request, "src:announcements:create", 30);
  if (hit) return hit;
  const guarded = await requireAnyPermission([...PUBLISH]);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const item = await registry.createAnnouncement(parsed.body, {
      id: guarded.user.id,
      name: guarded.user.name,
    });
    await audit({
      actorId: guarded.user.id,
      action: "src.announcements.create",
      targetType: "announcement",
      targetId: item.id,
      detail: item.title,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return invalidInput();
    throw error;
  }
}
