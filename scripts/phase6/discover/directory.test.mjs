import assert from "node:assert/strict";
import test from "node:test";
import {
  discoverDirectory,
  mixedDiscoverItems,
  discoverKey,
} from "../../../src/lib/discover/directory.ts";
import { discoverStatus } from "../../../src/lib/discover/status.ts";
import { discoverCategories } from "../../../src/config/discover.ts";
import { sections, items, filter, now, find } from "./native-helpers.mjs";
test("the 24-record campus edit spans all eight real demo collections, not invented popularity", () => {
  const result = discoverDirectory(sections, filter, [], now);
  assert.equal(result.total, 24);
  assert.equal(result.totalPages, 4);
  assert.equal(result.items.length, 6);
  assert.deepEqual(
    result.items.slice(0, 2).map((i) => i.title),
    ["Code Collective", "Innovation Night"],
  );
  const edit = Array.from(
    { length: 4 },
    (_, n) =>
      discoverDirectory(sections, { ...filter, page: n + 1 }, [], now).items,
  ).flat();
  assert.deepEqual(
    [...new Set(edit.map((i) => i.category))].sort(),
    [...discoverCategories].sort(),
  );
  assert.ok(!edit.some((i) => i.id === "e15" || i.id === "e16"));
});
test("all canonical listings are reachable through unique six-card pages and clamped navigation", () => {
  const f = { ...filter, view: "all" },
    all = Array.from(
      { length: Math.ceil(items.length / 6) },
      (_, n) =>
        discoverDirectory(sections, { ...f, page: n + 1 }, [], now).items,
    ).flat();
  assert.equal(all.length, items.length);
  assert.equal(new Set(all.map(discoverKey)).size, items.length);
  assert.equal(
    discoverDirectory(sections, { ...f, page: 999 }, [], now).page,
    Math.ceil(items.length / 6),
  );
  assert.equal(
    discoverDirectory(sections, { ...f, page: NaN }, [], now).page,
    1,
  );
  assert.equal(
    discoverDirectory(sections, { ...f, page: -2 }, [], now).page,
    1,
  );
});
test("case/diacritic/space-aware query searches descriptions, venues, courses and categories across the edit limit", () => {
  assert.ok(
    discoverDirectory(
      sections,
      { ...filter, query: "  INNOVÁTION  " },
      [],
      now,
    ).items.some((i) => i.id === "e1"),
  );
  assert.ok(
    discoverDirectory(
      sections,
      { ...filter, query: "ITT 315" },
      [],
      now,
    ).items.some((item) => item.id === "r2"),
  );
  assert.equal(
    discoverDirectory(
      sections,
      { ...filter, category: "events", query: "Auditorium" },
      [],
      now,
    ).items[0].id,
    "e1",
  );
  assert.equal(
    discoverDirectory(
      sections,
      { ...filter, category: "accommodation", query: "Water heater" },
      [],
      now,
    ).items[0].id,
    "h2",
  );
  assert.ok(
    discoverDirectory(
      sections,
      { ...filter, query: find("events", "e16").title },
      [],
      now,
    ).total > 0,
  );
  assert.equal(
    discoverDirectory(
      sections,
      { ...filter, query: "nothing-from-mars" },
      [],
      now,
    ).total,
    0,
  );
});
test("balanced/name/date sorts are deterministic, undated last and do not mutate caller data", () => {
  const original = JSON.stringify(sections),
    all = items.length;
  assert.equal(mixedDiscoverItems(items).length, all);
  const byName = discoverDirectory(
    sections,
    { ...filter, view: "all", sort: "name" },
    [],
    now,
  ).items;
  assert.deepEqual(
    byName.map((i) => i.title),
    [...items]
      .sort(
        (a, b) =>
          a.title.localeCompare(b.title, "en-GH") ||
          discoverKey(a).localeCompare(discoverKey(b)),
      )
      .slice(0, 6)
      .map((i) => i.title),
  );
  const dated = Array.from(
    { length: Math.ceil(items.length / 6) },
    (_, n) =>
      discoverDirectory(
        sections,
        { ...filter, view: "all", sort: "date", page: n + 1 },
        [],
        now,
      ).items,
  ).flat();
  assert.ok(dated[0].date);
  assert.equal(dated.at(-1).date, undefined);
  assert.equal(JSON.stringify(sections), original);
});
test("saved views compose with category/query, source-qualified IDs and page clamping", () => {
  const saved = [
    { category: "clubs", id: "club-1" },
    { category: "events", id: "e1" },
    { category: "marketplace", id: "mk1" },
    { category: "accommodation", id: "h1" },
    { category: "lost-found", id: "lf1" },
  ];
  assert.equal(
    discoverDirectory(sections, { ...filter, view: "saved" }, saved, now).total,
    5,
  );
  assert.equal(
    discoverDirectory(
      sections,
      { ...filter, view: "saved", category: "events", query: "Night" },
      saved,
      now,
    ).total,
    1,
  );
  assert.equal(
    discoverDirectory(sections, { ...filter, view: "saved" }, [], now).total,
    0,
  );
  assert.notEqual(
    discoverKey({ category: "events", id: "same" }),
    discoverKey({ category: "clubs", id: "same" }),
  );
  const duplicated = [...sections, sections[0]];
  assert.equal(
    discoverDirectory(duplicated, { ...filter, view: "all" }, [], now).total,
    items.length,
  );
});
test("status clock honestly handles cancellation, past/full/deadline/live and date-only events", () => {
  assert.equal(discoverStatus(find("events", "e15"), now), "Cancelled");
  assert.equal(discoverStatus(find("events", "e16"), now), "Event ended");
  assert.equal(discoverStatus(find("events", "e5"), now), "Fully booked");
  assert.equal(
    discoverStatus(find("events", "e1"), new Date("2026-10-16T17:30:00Z")),
    "Bookings closed",
  );
  const live = structuredClone(find("events", "e1"));
  delete live.event.closesAt;
  assert.equal(
    discoverStatus(live, new Date("2026-10-16T18:00:00Z")),
    "Happening now",
  );
  delete live.event.endsAt;
  delete live.event.startsAt;
  assert.equal(
    discoverStatus(live, new Date("2026-10-16T12:00:00Z")),
    "Explore & RSVP",
  );
  assert.equal(
    discoverStatus(live, new Date("2026-10-17T00:00:00Z")),
    "Event ended",
  );
  assert.equal(discoverStatus(live, new Date(NaN)), "Schedule unavailable");
  const opportunity = { ...find("opportunities", "o1"), date: "2026-10-11" };
  assert.equal(discoverStatus(opportunity, now), "Deadline today");
  assert.equal(
    discoverStatus(opportunity, new Date("2026-10-12T00:00:00Z")),
    "Deadline passed",
  );
});
