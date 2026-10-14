import { NextResponse } from "next/server";
import { z } from "zod";
import { campus } from "@/server/campus";
import { notify } from "@/server/notify";
import { invalidInput, limited, notFoundResponse, readJson, requireUser } from "@/server/guards";
import { findEvent } from "../../../_lib/lookup";

const postSchema = z.object({ attending: z.boolean() });

function toWire(rsvp: { id: string; eventId: string } | null, attending: boolean) {
  return {
    attending,
    rsvp: rsvp ? { id: rsvp.id, eventId: rsvp.eventId, status: "confirmed" as const } : null,
  };
}

/** RSVP or cancel for a published event (capacity enforced). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "events:rsvp", 60);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = postSchema.safeParse(parsed.body);
  if (!body.success) return invalidInput();
  const { id } = await params;
  const event = findEvent(id);
  if (!event) return notFoundResponse("Event not found.");
  const result = await campus.setRsvp(
    { id: event.id, seats: event.seats, baseRegistered: event.baseRegistered },
    { id: guarded.user.id, name: guarded.user.name },
    body.data.attending,
  );
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 });
  if (body.data.attending && result.rsvp)
    await notify(guarded.user.id, {
      kind: "rsvp",
      title: "You're going",
      body: `Your spot at ${event.title} is confirmed.`,
      link: "/events",
    });
  return NextResponse.json(toWire(result.rsvp, body.data.attending));
}

/** Cancel an RSVP (idempotent). */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "events:rsvp:cancel", 60);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const { id } = await params;
  const event = findEvent(id);
  if (!event) return notFoundResponse("Event not found.");
  await campus.setRsvp(
    { id: event.id, seats: event.seats, baseRegistered: event.baseRegistered },
    { id: guarded.user.id, name: guarded.user.name },
    false,
  );
  return NextResponse.json(toWire(null, false));
}
