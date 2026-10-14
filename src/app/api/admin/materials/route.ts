import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { audit } from "@/server/audit";
import { adminRegistry } from "@/server/admin";
import { invalidInput, limited, readJson, requireAnyPermission } from "@/server/guards";

const MANAGE = ["academic.materials.manage", "platform.users.manage"] as const;

export async function GET(request: Request) {
  const hit = limited(request, "admin:materials:list", 120);
  if (hit) return hit;
  const guarded = await requireAnyPermission([...MANAGE], request);
  if (guarded instanceof NextResponse) return guarded;
  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  return NextResponse.json({ items: adminRegistry.listMaterials(status) });
}

export async function POST(request: Request) {
  const hit = limited(request, "admin:materials:create", 30);
  if (hit) return hit;
  const guarded = await requireAnyPermission([...MANAGE], request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const item = await adminRegistry.createMaterial(parsed.body, {
      id: guarded.user.id,
      name: guarded.user.name,
    });
    await audit({
      actorId: guarded.user.id,
      action: "academic.materials.create",
      targetType: "material",
      targetId: item.id,
      detail: item.title,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return invalidInput();
    throw error;
  }
}
