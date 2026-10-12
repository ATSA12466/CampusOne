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
  const hit = limited(request, "admin:reports:triage", 60);
  if (hit) return hit;
  const guarded = await requireAnyPermission(["community.moderate", "platform.users.manage"], request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const { id } = await params;
    const item = await adminRegistry.triageReport(id, parsed.body);
    if (!item) return notFoundResponse("Report not found.");
    await audit({
      actorId: guarded.user.id,
      action: `moderation.report.${item.status}`,
      targetType: "report",
      targetId: item.id,
    });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof ZodError) return invalidInput();
    throw error;
  }
}
