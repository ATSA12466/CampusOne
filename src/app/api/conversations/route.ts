import { NextResponse } from "next/server";
import { z } from "zod";
import { MessageError, messages } from "@/server/messages";
import { invalidInput, limited, readJson, requireUser } from "@/server/guards";
import { findClub } from "../_lib/lookup";
import { canManageClub } from "../_lib/manage";

const createSchema = z.union([
  z.object({ kind: z.literal("direct"), userId: z.string().min(1).max(80) }),
  z.object({
    kind: z.literal("group"),
    title: z.string().trim().min(1).max(80),
    memberIds: z.array(z.string().min(1).max(80)).min(1).max(50),
  }),
  z.object({
    kind: z.literal("club"),
    clubId: z.string().min(1).max(100),
    title: z.string().trim().min(1).max(80),
  }),
]);

/** Conversations visible to the signed-in user (poll-based messaging). */
export async function GET(request: Request) {
  const hit = limited(request, "conversations:list", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const items = messages.listConversations(guarded.user.id);
  return NextResponse.json({ items, total: items.length });
}

/** Start a direct/group conversation, or a club channel (managers only). */
export async function POST(request: Request) {
  const hit = limited(request, "conversations:create", 30);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = createSchema.safeParse(parsed.body);
  if (!body.success) return invalidInput();
  try {
    const me = { id: guarded.user.id, name: guarded.user.name };
    if (body.data.kind === "direct") {
      const item = await messages.findOrCreateDirect(me, body.data.userId);
      return NextResponse.json({ item }, { status: 201 });
    }
    if (body.data.kind === "group") {
      const item = await messages.createGroup(me, body.data);
      return NextResponse.json({ item }, { status: 201 });
    }
    const club = findClub(body.data.clubId);
    if (!club)
      return NextResponse.json({ error: "Club not found." }, { status: 404 });
    if (!canManageClub(guarded.serverUser, club.id, "club.members.manage"))
      return NextResponse.json(
        { error: "Only club managers can open a club channel." },
        { status: 403 },
      );
    const item = await messages.createClubChannel(me, {
      clubId: club.id,
      title: body.data.title,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof MessageError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof z.ZodError) return invalidInput();
    throw error;
  }
}
