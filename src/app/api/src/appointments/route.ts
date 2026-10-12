import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { audit } from "@/server/audit";
import { invalidInput, limited, readJson, requireAnyPermission } from "@/server/guards";
import { registry } from "@/server/registry";

const REVIEW = ["src.appointments.review", "platform.users.manage"] as const;

export async function GET(request: Request) {
  const hit = limited(request, "src:appointments:list", 120);
  if (hit) return hit;
  const guarded = await requireAnyPermission([...REVIEW], request);
  if (guarded instanceof NextResponse) return guarded;
  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  return NextResponse.json({ items: registry.listAppointments(status) });
}

export async function POST(request: Request) {
  const hit = limited(request, "src:appointments:create", 30);
  if (hit) return hit;
  const guarded = await requireAnyPermission([...REVIEW], request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const item = await registry.createAppointment(parsed.body, guarded.user.id);
    await audit({
      actorId: guarded.user.id,
      action: "src.appointments.create",
      targetType: "appointment",
      targetId: item.id,
      detail: `${item.appointeeName} · ${item.position}`,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return invalidInput();
    throw error;
  }
}
