import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { audit } from "@/server/audit";
import {
  invalidInput,
  limited,
  notFoundResponse,
  readJson,
  requireAnyPermission,
} from "@/server/guards";
import { registry } from "@/server/registry";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "src:clubs:decide", 60);
  if (hit) return hit;
  const guarded = await requireAnyPermission(["src.clubs.review", "platform.users.manage"], request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const { id } = await params;
    const item = await registry.decideClub(id, parsed.body, guarded.user.id);
    if (!item) return notFoundResponse("Club registration not found.");
    await audit({
      actorId: guarded.user.id,
      action: `src.clubs.${item.status}`,
      targetType: "club",
      targetId: item.id,
      detail: item.name,
    });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof ZodError) return invalidInput();
    throw error;
  }
}
