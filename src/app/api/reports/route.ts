import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { audit } from "@/server/audit";
import { adminRegistry } from "@/server/admin";
import { invalidInput, limited, readJson, requireUser } from "@/server/guards";

export async function POST(request: Request) {
  const hit = limited(request, "reports:submit", 20);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const item = await adminRegistry.submitReport(parsed.body, {
      id: guarded.user.id,
      name: guarded.user.name,
    });
    await audit({
      actorId: guarded.user.id,
      action: "moderation.report.submit",
      targetType: "report",
      targetId: item.id,
      detail: `${item.targetType}:${item.targetId}`,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return invalidInput();
    throw error;
  }
}
