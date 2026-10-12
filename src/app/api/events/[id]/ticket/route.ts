import { NextResponse } from "next/server";
import { campus } from "@/server/campus";
import { limited, notFoundResponse, requireUser } from "@/server/guards";
import { findEvent } from "../../../_lib/lookup";

/** Attendance ticket for a confirmed RSVP (holder only). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "events:ticket", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const { id } = await params;
  const event = findEvent(id);
  if (!event) return notFoundResponse("Event not found.");
  const rsvp = campus.getRsvp(event.id, guarded.user.id);
  if (!rsvp)
    return NextResponse.json(
      { error: "RSVP to this event to get your ticket." },
      { status: 404 },
    );
  return NextResponse.json({
    ticket: {
      reference: rsvp.ticketRef,
      name: guarded.user.name,
      event: event.title,
      status: "confirmed",
      issuedAt: rsvp.createdAt,
    },
  });
}
