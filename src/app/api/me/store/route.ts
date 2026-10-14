import { NextResponse } from "next/server";
import { z } from "zod";
import { limited, requireUser, readJson, invalidInput } from "@/server/guards";
import {
  ME_COLLECTIONS,
  MeStoreError,
  listMine,
  meCollectionSchema,
  putMine,
  removeMine,
  type MeCollection,
} from "@/server/me-store";

const putSchema = z.object({
  collection: meCollectionSchema,
  item: z.record(z.string(), z.unknown()),
});

/** List the caller's own items. `?collection=a` or `?collection=a,b`. */
export async function GET(request: Request) {
  const hit = limited(request, "me:store:list", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;

  const raw = new URL(request.url).searchParams.get("collection") ?? "";
  const names = raw.split(",").map((n) => n.trim()).filter(Boolean);
  if (!names.length || names.length > ME_COLLECTIONS.length) return invalidInput();
  const parsed: MeCollection[] = [];
  for (const name of names) {
    const one = meCollectionSchema.safeParse(name);
    if (!one.success) return invalidInput();
    parsed.push(one.data);
  }
  const rows = listMine(guarded.user.id, parsed);
  if (parsed.length === 1) {
    return NextResponse.json({ items: rows.map((r) => r.item) });
  }
  const grouped: Record<string, unknown[]> = Object.fromEntries(
    parsed.map((n) => [n, []]),
  );
  for (const row of rows) grouped[row.collection].push(row.item);
  return NextResponse.json({ items: grouped });
}

/** Upsert one of the caller's own items (validated by the shared schema). */
export async function PUT(request: Request) {
  const hit = limited(request, "me:store:put", 60);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const body = putSchema.safeParse(parsed.body);
  if (!body.success) return invalidInput();
  try {
    const item = await putMine(guarded.user.id, body.data.collection, body.data.item);
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof MeStoreError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

/** Delete one of the caller's own items. */
export async function DELETE(request: Request) {
  const hit = limited(request, "me:store:delete", 60);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;

  const params = new URL(request.url).searchParams;
  const collection = meCollectionSchema.safeParse(params.get("collection") ?? "");
  const id = (params.get("id") ?? "").slice(0, 100);
  if (!collection.success || !id) return invalidInput();
  const removed = await removeMine(guarded.user.id, collection.data, id);
  return NextResponse.json({ removed });
}
