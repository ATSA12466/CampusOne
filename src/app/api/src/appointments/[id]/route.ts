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
  const hit = limited(request, "src:appointments:revoke", 60);
  if (hit) return hit;
  const guarded = await requireAnyPermission(["src.appointments.review", "platform.users.manage"]);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const { id } = await params;
    const item = await registry.revokeAppointment(id, parsed.body, guarded.user.id);
    if (!item) return notFoundResponse("Appointment not found.");
    await audit({
      actorId: guarded.user.id,
      action: "src.appointments.revoke",
      targetType: "appointment",
      targetId: item.id,
      detail: `${item.appointeeName} · ${item.position}`,
    });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof ZodError) return invalidInput("A reason is required to revoke.");
    throw error;
  }
}
