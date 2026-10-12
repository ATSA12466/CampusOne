import { NextResponse } from "next/server";
import { z } from "zod";
import { MessageError, messages } from "@/server/messages";
import { invalidInput, limited, readJson, requireUser } from "@/server/guards";

const postSchema = z.object({ body: z.string().trim().min(1).max(2000) });

/** Recent messages (members only). Poll for updates. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "conversations:messages:list", 180);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const { id } = await params;
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? "50");
  try {
    const items = await messages.listMessages(
      id,
      guarded.user.id,
      Number.isInteger(limit) ? limit : 50,
    );
    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    if (error instanceof MessageError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}

/** Send a message (members only). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "conversations:messages:post", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = postSchema.safeParse(parsed.body);
  if (!body.success) return invalidInput();
  const { id } = await params;
  try {
    const item = await messages.postMessage(
      id,
      { id: guarded.user.id, name: guarded.user.name },
      body.data.body,
    );
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof MessageError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
