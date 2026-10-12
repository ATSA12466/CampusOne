import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { audit } from "@/server/audit";
import { invalidInput, limited, readJson, requireAnyPermission, requireUser } from "@/server/guards";
import { registry } from "@/server/registry";

export async function GET(request: Request) {
  const hit = limited(request, "src:requests:list", 120);
  if (hit) return hit;
  const guarded = await requireAnyPermission(["src.requests.manage", "platform.users.manage"]);
  if (guarded instanceof NextResponse) return guarded;
  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  return NextResponse.json({ items: registry.listRequests(status) });
}

export async function POST(request: Request) {
  const hit = limited(request, "src:requests:submit", 20);
  if (hit) return hit;
  const guarded = await requireUser();
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const item = await registry.submitRequest(parsed.body, {
      id: guarded.user.id,
      name: guarded.user.name,
    });
    await audit({
      actorId: guarded.user.id,
      action: "src.requests.submit",
      targetType: "request",
      targetId: item.id,
      detail: item.subject,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return invalidInput();
    throw error;
  }
}
