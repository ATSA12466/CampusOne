import assert from "node:assert/strict";
import test from "node:test";
import {
  eventItemSchema,
  eventDetailsSchema,
  eventActivitySchema,
  eventTicketSchema,
} from "../../../src/services/validation/event.schema.ts";
import { rsvpSchema } from "../../../src/features/events/validation/rsvp.schema.ts";
import { events, find } from "./native-helpers.mjs";
test("optional rich event DTO supports every fixture and untouched legacy base fields", () => {
  for (const e of events) assert.equal(eventItemSchema.safeParse(e).success, true);
  const { details, ...legacy } = find("e1");
  assert.equal(eventItemSchema.safeParse(legacy).success, true);
  assert.equal(eventItemSchema.parse(legacy).details, undefined);
});
test("rich DTO bounds photos, fee, timestamps, agenda and the date/timezone relationship", () => {
  const e = find("e1");
  for (const patch of [
    { cover: "javascript:alert(1)" },
    { cover: "https://unapproved.example/a.webp" },
    { cover: "blob:transient" },
    { coverAlt: "bad" },
    { price: -1 },
    { endsAt: e.details.startsAt },
    { endsAt: "2026-10-25T21:00:00Z" },
    { bookingClosesAt: "2026-10-18T00:00:00Z" },
    {
      agenda: [
        { title: "Session", description: "After the event", startsAt: "2026-10-18T00:00:00Z" },
      ],
    },
    { speakers: Array(13).fill({ name: "Name", role: "Role" }) },
    { timeZone: "Europe/London" },
  ])
    assert.equal(
      eventDetailsSchema.safeParse({ ...e.details, ...patch }).success,
      false,
      JSON.stringify(patch),
    );
  for (const patch of [
    { date: "2026-10-17" },
    { registered: 301 },
    { seats: -1 },
    { seats: 1.2 },
    { date: "2026-02-30" },
    { id: "e/a" },
    { id: "e..a" },
    { id: "." },
    { id: "e#1" },
    { id: " " },
  ])
    assert.equal(eventItemSchema.safeParse({ ...e, ...patch }).success, false);
  const offset = { ...e, details: { ...e.details, startsAt: "2026-10-16T19:00:00+01:00" } };
  assert.equal(eventItemSchema.safeParse(offset).success, true);
});
test("activity/ticket schemas reject unbounded or invented authority; QR payload is byte-bounded", () => {
  assert.deepEqual(eventActivitySchema.parse({ goingIds: ["e1"], savedIds: [] }).attendance, []);
  assert.equal(
    eventActivitySchema.safeParse({ goingIds: Array(501).fill("e1"), savedIds: [] }).success,
    false,
  );
  assert.equal(
    eventActivitySchema.safeParse({
      goingIds: [],
      savedIds: [],
      attendance: [{ eventId: "e1", registered: -1 }],
    }).success,
    false,
  );
  const ticket = {
    eventId: "e1",
    reference: "fixture",
    payload: "fixture-private-token",
    status: "valid",
  };
  assert.equal(eventTicketSchema.safeParse(ticket).success, true);
  for (const patch of [
    { status: "admin-approved" },
    { payload: "x".repeat(1025) },
    { payload: "🎉".repeat(500) },
  ])
    assert.equal(eventTicketSchema.safeParse({ ...ticket, ...patch }).success, false);
});
test("RSVP consent cannot be skipped or made truthy with a non-boolean value", () => {
  assert.equal(rsvpSchema.safeParse({ acknowledged: false }).success, false);
  assert.equal(rsvpSchema.safeParse({ acknowledged: "yes" }).success, false);
  assert.equal(rsvpSchema.safeParse({ acknowledged: true }).success, true);
});
