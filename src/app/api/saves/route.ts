import { NextResponse } from "next/server";
import { z } from "zod";
import { campus, saveKindSchema, type Save } from "@/server/campus";
import { store } from "@/server/store";
import { invalidInput, limited, readJson, requireUser } from "@/server/guards";

// Generic saved-items API. Clubs/events keep their dedicated routes; listing,
// media, announcement and post saves share this one. Listing entityIds are
// composite ("domain:id", e.g. "marketplace:mk1") so ids stay unique.
const putSchema = z.object({
  kind: saveKindSchema,
  entityId: z.string().min(1).max(160),
  saved: z.boolean(),
});

/** List the caller's saves, optionally filtered by `?kind=`. */
export async function GET(request: Request) {
  const hit = limited(request, "saves:list", 180);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;

  const kindRaw = new URL(request.url).searchParams.get("kind");
  if (kindRaw !== null && !saveKindSchema.safeParse(kindRaw).success) {
    return invalidInput();
  }
  const items = store
    .filter<Save>(
      "saves",
      (s) => s.userId === guarded.user.id && (kindRaw === null || s.kind === kindRaw),
    )
    .map((s) => ({ kind: s.kind, entityId: s.entityId, createdAt: s.createdAt }));
  return NextResponse.json({ items });
}

/** Save or unsave any supported entity. */
export async function PUT(request: Request) {
  const hit = limited(request, "saves:set", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = putSchema.safeParse(parsed.body);
  if (!body.success) return invalidInput();
  await campus.setSaved(
    guarded.user.id,
    body.data.kind,
    body.data.entityId,
    body.data.saved,
  );
  return NextResponse.json({ saved: body.data.saved });
}
