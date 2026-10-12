import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { audit } from "@/server/audit";
import { invalidInput, limited, readJson, requireAnyPermission, requireUser } from "@/server/guards";
import { registry } from "@/server/registry";

export async function GET(request: Request) {
  const hit = limited(request, "src:clubs:list", 120);
  if (hit) return hit;
  const guarded = await requireAnyPermission(["src.clubs.review", "platform.users.manage"]);
  if (guarded instanceof NextResponse) return guarded;
  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  return NextResponse.json({ items: registry.listClubs(status) });
}

export async function POST(request: Request) {
  const hit = limited(request, "src:clubs:submit", 20);
  if (hit) return hit;
  const guarded = await requireUser();
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const item = await registry.submitClub(parsed.body, {
      id: guarded.user.id,
      name: guarded.user.name,
    });
    await audit({
      actorId: guarded.user.id,
      action: "src.clubs.submit",
      targetType: "club",
      targetId: item.id,
      detail: item.name,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return invalidInput();
    throw error;
  }
}
