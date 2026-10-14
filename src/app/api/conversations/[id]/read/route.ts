import { NextResponse } from "next/server";
import { MessageError, messages } from "@/server/messages";
import { limited, requireUser } from "@/server/guards";

/** Mark a conversation read (members only). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "conversations:read", 180);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const { id } = await params;
  try {
    await messages.markRead(id, guarded.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof MessageError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
