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
  const hit = limited(request, "src:requests:triage", 60);
  if (hit) return hit;
  const guarded = await requireAnyPermission(["src.requests.manage", "platform.users.manage"], request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const { id } = await params;
    const item = await registry.triageRequest(id, parsed.body);
    if (!item) return notFoundResponse("Request not found.");
    await audit({
      actorId: guarded.user.id,
      action: `src.requests.${item.status}`,
      targetType: "request",
      targetId: item.id,
      detail: item.subject,
    });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof ZodError) return invalidInput();
    throw error;
  }
}
