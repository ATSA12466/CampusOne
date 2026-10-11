import assert from "node:assert/strict";
import test from "node:test";
import { stat } from "node:fs/promises";
import { eventDirectory, eventPageSize } from "../../../src/lib/events/directory.ts";
import { eventCover, eventPrice, eventGallery } from "../../../src/lib/events/media.ts";
import { imageForSrc } from "../../../src/config/images.ts";
import { events, find, filter, activity, now } from "./native-helpers.mjs";
test("sixteen fictional events preserve both original records, six categories and registered photo budgets", async () => {
  assert.equal(events.length, 16);
  assert.equal(new Set(events.map((e) => e.id)).size, 16);
  assert.equal(new Set(events.map((e) => e.category)).size, 6);
  for (const expected of [
    {
      id: "e1",
      title: "Innovation Night",
      venue: "Main Auditorium",
      date: "2026-10-16",
      category: "Showcase",
      seats: 300,
      registered: 120,
    },
    {
      id: "e2",
      title: "Data Science Career Talk",
      venue: "Seminar Hall A",
      date: "2026-10-20",
      category: "Career",
      seats: 180,
      registered: 86,
    },
  ])
    for (const [key, value] of Object.entries(expected))
      assert.equal(find(expected.id)[key], value);
  for (const event of events) {
    assert.equal(eventCover(event).provenance, "generated");
    assert.ok(event.details.description.some((t) => /fictional/i.test(t)));
    assert.ok(eventCover(event).alt.length > 20);
    assert.ok(eventGallery(event).length);
    assert.ok(imageForSrc(event.details.cover)?.blurDataURL?.startsWith("data:image/"));
  }
  for (const name of ["music", "showcase", "social"])
    assert.ok((await stat(`public/images/demo/event-${name}.webp`)).size < 150000);
});
test("six-per-page discovery clamps bad pages and covers every record without duplicates", () => {
  assert.equal(eventPageSize, 6);
  const pages = [1, 2, 3].map((page) =>
    eventDirectory(events, { ...filter, page }, activity, now, "demo"),
  );
  assert.deepEqual(
    pages.map((p) => p.items.length),
    [6, 6, 4],
  );
  assert.equal(pages[0].total, 16);
  assert.equal(new Set(pages.flatMap((p) => p.items.map((e) => e.id))).size, 16);
  for (const [page, expected] of [
    [99, 3],
    [-1, 1],
    [NaN, 1],
    [1.5, 1],
  ])
    assert.equal(eventDirectory(events, { ...filter, page }, activity, now, "demo").page, expected);
});
test("search folds accents/case and composes with category, free, saved and RSVP filters", () => {
  const a = { ...activity, savedIds: ["e1", "e3"], goingIds: ["e1", "e2"] },
    run = (patch) => eventDirectory(events, { ...filter, ...patch }, a, now, "demo");
  assert.equal(
    run({ query: "  INNOVÁTION  ", category: "Showcase", freeOnly: true, view: "going" }).items[0]
      .id,
    "e1",
  );
  assert.equal(run({ view: "saved" }).total, 2);
  assert.equal(run({ view: "going" }).total, 2);
  assert.equal(run({ view: "saved", freeOnly: true }).total, 1);
  assert.equal(run({ category: "Career" }).total, 3);
  assert.ok(run({ query: "courtyard" }).total > 0);
  assert.ok(run({ query: "student voices" }).items.some((e) => e.id === "e3"));
  assert.equal(run({ query: "no-such-event" }).total, 0);
});
test("date windows use real campus instants; upcoming includes cancellations but never past records", () => {
  const run = (time) => eventDirectory(events, { ...filter, time }, activity, now, "demo");
  assert.equal(run("all").total, 16);
  assert.equal(run("past").total, 1);
  assert.equal(run("past").items[0].id, "e16");
  assert.equal(run("upcoming").total, 15);
  assert.deepEqual(
    run("week").items.map((e) => e.id),
    ["e10", "e9", "e4", "e7", "e1", "e3"],
  );
  assert.equal(run("week").total, 6);
  assert.equal(run("month").total, 15);
  const morning = new Date("2026-10-11T00:00:00Z");
  assert.equal(
    eventDirectory(events, { ...filter, time: "week" }, activity, morning, "demo").total,
    6,
  );
  assert.throws(
    () => eventDirectory(events, filter, activity, new Date("bad"), "demo"),
    /valid event clock/,
  );
});
test("soon/name/popularity/price sorting is deterministic, immutable and authoritative in API mode", () => {
  const before = structuredClone(events),
    run = (sort, a = activity, source = "demo") =>
      eventDirectory(events, { ...filter, sort }, a, now, source);
  assert.equal(run("soon").items[0].id, "e16");
  const names = run("name").items.map((e) => e.title);
  assert.deepEqual(
    names,
    [...names].sort((a, b) => a.localeCompare(b, "en-GH")),
  );
  assert.equal(run("popular").items[0].id, "e1");
  assert.ok(run("price").items.every((e) => e.details.price === 0));
  assert.equal(
    run("popular", { ...activity, attendance: [{ eventId: "e6", registered: 199 }] }, "api")
      .items[0].id,
    "e6",
  );
  assert.deepEqual(events, before);
});
test("legacy DTOs never invent fee, gallery or timed information; unknown price is not free", () => {
  const { details, ...legacy } = find("e1");
  assert.equal(eventPrice(legacy), "Price not supplied");
  assert.deepEqual(eventGallery(legacy), []);
  assert.equal(eventCover(legacy).provenance, "generated");
  assert.equal(eventPrice(find("e1")), "Free to RSVP");
  assert.match(eventPrice(find("e3")), /GH₵20/);
  assert.equal(
    eventDirectory([legacy], { ...filter, freeOnly: true }, activity, now, "demo").total,
    0,
  );
  assert.equal(
    eventCover({
      ...legacy,
      details: {
        ...details,
        cover: "/images/custom.webp",
        coverAlt: "A photo supplied by its publisher",
      },
    }).provenance,
    "upload",
  );
});
