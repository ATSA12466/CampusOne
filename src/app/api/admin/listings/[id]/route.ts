import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { audit } from "@/server/audit";
import { adminRegistry } from "@/server/admin";
import {
  invalidInput,
  limited,
  notFoundResponse,
  readJson,
  requireAnyPermission,
} from "@/server/guards";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "admin:listings:decide", 60);
  if (hit) return hit;
  const guarded = await requireAnyPermission([
    "accommodation.listings.review",
    "platform.users.manage",
  ], request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const { id } = await params;
    const item = await adminRegistry.decideListing(id, parsed.body, guarded.user.id);
    if (!item) return notFoundResponse("Listing not found.");
    await audit({
      actorId: guarded.user.id,
      action: `accommodation.listings.${item.status}`,
      targetType: "listing",
      targetId: item.id,
      detail: item.title,
    });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof ZodError) return invalidInput();
    throw error;
  }
}
