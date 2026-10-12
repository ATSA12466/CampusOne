import { NextResponse } from "next/server";
import { z } from "zod";
import { listNotifications, markNotificationsRead, unreadCount } from "@/server/notify";
import { invalidInput, limited, readJson, requireUser } from "@/server/guards";

const patchSchema = z.object({
  ids: z.union([z.array(z.string().min(1).max(80)).max(100), z.literal("all")]),
});

/** Server notification feed for the signed-in user. */
export async function GET(request: Request) {
  const hit = limited(request, "notifications:list", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? "50");
  const items = listNotifications(
    guarded.user.id,
    Number.isInteger(limit) ? limit : 50,
  );
  return NextResponse.json({ items, total: items.length, unread: unreadCount(guarded.user.id) });
}

/** Mark notifications read (`{ ids: [...] }` or `{ ids: "all" }`). */
export async function PATCH(request: Request) {
  const hit = limited(request, "notifications:read", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = patchSchema.safeParse(parsed.body);
  if (!body.success) return invalidInput();
  const updated = await markNotificationsRead(guarded.user.id, body.data.ids);
  return NextResponse.json({ updated, unread: unreadCount(guarded.user.id) });
}
