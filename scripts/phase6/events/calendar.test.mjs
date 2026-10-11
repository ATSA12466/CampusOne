import assert from "node:assert/strict";
import test from "node:test";
import { eventCalendar } from "../../../src/lib/events/calendar.ts";
import { find } from "./native-helpers.mjs";
const generated = "2026-10-11T12:00:00Z",
  unfold = (text) => text.replace(/\r\n[ \t]/g, "");
test("timed ICS is a real CRLF RFC5545 export with UTC instants, unique source UID and explicit demo labels", () => {
  const { content, filename } = eventCalendar(find("e1"), "demo", generated);
  assert.equal(filename, "campusone-demo-e1.ics");
  assert.match(content, /BEGIN:VCALENDAR\r\nVERSION:2.0/);
  assert.ok(!/[^\r]\n/.test(content));
  assert.match(content, /DTSTART:20261016T180000Z/);
  assert.match(content, /DTEND:20261016T210000Z/);
  assert.match(content, /DTSTAMP:20261011T120000Z/);
  assert.match(content, /SUMMARY:DEMO: Innovation Night/);
  assert.match(content, /STATUS:TENTATIVE/);
  assert.match(unfold(content), /Not an official invitation or entry credential/);
  assert.ok(content.endsWith("END:VCALENDAR\r\n"));
  const api = eventCalendar(find("e1"), "api", generated);
  assert.ok(api.content.includes("UID:api-e1@campusone.local"));
  assert.match(api.content, /STATUS:CONFIRMED/);
  assert.ok(!api.content.includes("SUMMARY:DEMO:"));
});
test("UTF-8 lines fold at 75 octets without splitting a codepoint or corrupting Ghanaian characters", () => {
  const e = structuredClone(find("e1"));
  e.title = "Ɔdɔ café, GH₵20; " + "🎉ɛ".repeat(30);
  e.details.description = ["A special gathering, with commas; and slashes \\ plus a new\nline."];
  const { content } = eventCalendar(e, "demo", generated);
  for (const line of content.split("\r\n"))
    assert.ok(
      new TextEncoder().encode(line).length <= 75,
      `${new TextEncoder().encode(line).length} octets`,
    );
  assert.ok(!content.includes("�"));
  assert.ok(unfold(content).includes("SUMMARY:DEMO: Ɔdɔ café\\, GH₵20\\;"));
  assert.ok(unfold(content).includes("slashes \\\\ plus a new\\nline."));
});
test("text, filenames and identifiers cannot inject new calendar properties", () => {
  const e = {
    ...find("e1"),
    id: "e/a?b\r\nATTENDEE:x",
    title: "Hello\r\nATTENDEE:private@example.com",
    venue: "Room;B, left \\ right",
  };
  const file = eventCalendar(e, "demo", generated),
    text = unfold(file.content);
  assert.ok(!text.includes("\r\nATTENDEE:"));
  assert.ok(text.includes("SUMMARY:DEMO: Hello\\nATTENDEE:"));
  assert.ok(text.includes("LOCATION:Room\\;B\\, left \\\\ right"));
  assert.ok(!/[\/\r\n?]/.test(file.filename));
  assert.equal((text.match(/BEGIN:VEVENT/g) ?? []).length, 1);
});
test("legacy all-day export ends on the next date, including year and leap-day rollover", () => {
  const { details, ...base } = find("e1");
  for (const [date, end] of [
    ["2026-12-31", "20270101"],
    ["2028-02-28", "20280229"],
    ["2028-02-29", "20280301"],
  ]) {
    const { content } = eventCalendar({ ...base, date }, "api", generated);
    assert.ok(content.includes(`DTSTART;VALUE=DATE:${date.replaceAll("-", "")}`));
    assert.ok(content.includes(`DTEND;VALUE=DATE:${end}`));
    assert.match(content, /STATUS:TENTATIVE/);
    assert.ok(!content.includes("DTSTART:"));
  }
});
test("cancellation and malformed timestamps/durations are handled without fake official times", () => {
  assert.match(eventCalendar(find("e15"), "demo", generated).content, /STATUS:CANCELLED/);
  assert.throws(
    () => eventCalendar({ ...find("e1"), date: "2026-02-30" }, "demo", generated),
    /valid calendar date/,
  );
  assert.throws(() => eventCalendar(find("e1"), "demo", "bad"), /valid event time/);
  const e = structuredClone(find("e1"));
  e.details.endsAt = e.details.startsAt;
  assert.throws(() => eventCalendar(e, "demo", generated), /invalid calendar duration/);
});
