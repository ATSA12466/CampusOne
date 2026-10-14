import { NextResponse } from "next/server";
import { z } from "zod";
import { devices } from "@/server/devices";
import { invalidInput, limited, readJson, requireUser } from "@/server/guards";

/** Registered push devices for the signed-in user. */
export async function GET(request: Request) {
  const hit = limited(request, "devices:list", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const items = devices.listMine(guarded.user.id);
  return NextResponse.json({ items, total: items.length });
}

/** Register (or refresh) a push token. Sending needs the Firebase project. */
export async function POST(request: Request) {
  const hit = limited(request, "devices:register", 60);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const item = await devices.register(guarded.user.id, parsed.body);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return invalidInput();
    throw error;
  }
}

/** Revoke a push device (`?id=`). */
export async function DELETE(request: Request) {
  const hit = limited(request, "devices:revoke", 60);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) return invalidInput();
  await devices.revoke(guarded.user.id, id);
  return NextResponse.json({ ok: true });
}
