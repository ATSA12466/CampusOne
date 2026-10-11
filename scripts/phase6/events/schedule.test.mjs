import assert from "node:assert/strict";
import test from "node:test";
import {
  eventPhase,
  bookingState,
  countdown,
  eventCount,
  eventDate,
  eventTime,
  agendaTime,
} from "../../../src/lib/events/schedule.ts";
import { find, now } from "./native-helpers.mjs";
test("scheduled/live/ended/cancelled and date-only today states use Accra time truthfully", () => {
  const e = find("e1");
  assert.equal(eventPhase(e, now), "upcoming");
  assert.equal(eventPhase(e, new Date("2026-10-16T18:00:00Z")), "live");
  assert.equal(eventPhase(e, new Date("2026-10-16T21:00:00Z")), "ended");
  assert.equal(eventPhase(find("e15"), now), "cancelled");
  assert.equal(eventPhase(find("e16"), now), "ended");
  assert.equal(eventPhase(e, new Date("bad")), "unknown");
  const { details, ...legacy } = e;
  assert.equal(eventPhase(legacy, new Date("2026-10-16T23:59:59Z")), "today");
  assert.equal(eventPhase(legacy, new Date("2026-10-17T00:00:00Z")), "ended");
  assert.equal(eventTime(legacy), "Time not supplied");
  assert.match(eventDate(e), /16/);
});
test("capacity and booking deadlines close at exact instants; API/demo counts cannot double-add", () => {
  const e = find("e1");
  assert.equal(bookingState(e, now), "available");
  assert.equal(bookingState(find("e5"), now), "full");
  assert.equal(bookingState(e, new Date("2026-10-16T17:29:59Z")), "available");
  assert.equal(bookingState(e, new Date("2026-10-16T17:30:00Z")), "closed");
  assert.equal(bookingState(find("e15"), now), "cancelled");
  assert.equal(bookingState(find("e16"), now), "ended");
  assert.equal(bookingState({ ...e, date: "bad", details: undefined }, now), "unknown");
  assert.equal(eventCount(e, true, "demo"), 121);
  assert.equal(eventCount(e, true, "api"), 120);
  assert.equal(eventCount(e, true, "api", [{ eventId: "e1", registered: 121 }]), 121);
  assert.equal(eventCount(e, true, "api", [{ eventId: "e1", registered: 999 }]), 300);
});
test("countdowns are minute-safe and legacy dates never masquerade as a midnight start", () => {
  const e = find("e1");
  assert.equal(countdown(e, now), "5d 6h 0m until it starts");
  assert.equal(countdown(e, new Date("2026-10-16T17:59:01Z")), "1m until it starts");
  assert.equal(countdown(e, new Date("2026-10-16T18:00:00Z")), "Happening now");
  assert.equal(countdown(find("e15"), now), "Event cancelled");
  assert.equal(countdown(find("e16"), now), "This event has ended");
  const { details, ...legacy } = e;
  assert.equal(countdown(legacy, now), "Start time not supplied");
  assert.equal(countdown(legacy, new Date("2026-10-16T12:00:00Z")), "Today · time not supplied");
});

test("overnight/multi-day ranges and agenda labels expose their Accra dates, not invented same-day durations", () => {
  const e = structuredClone(find("e1"));
  e.details.endsAt = "2026-10-18T10:00:00Z";
  assert.match(eventTime(e), /18 Oct/);
  assert.match(agendaTime(e, "2026-10-17T14:00:00Z"), /17 Oct/);
  assert.equal(agendaTime(find("e1"), "2026-10-16T18:00:00Z"), "6:00 pm");
  assert.equal(eventPhase(e, new Date("2026-10-17T20:00:00Z")), "live");
});
