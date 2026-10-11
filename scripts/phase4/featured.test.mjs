import test from "node:test";
import assert from "node:assert/strict";
const { selectFeatured, upcomingEvents, openOpportunities } = await import(
  "../../src/lib/home/featured.ts"
);
const { featuredSchema } = await import("../../src/services/validation/home.schema.ts");
const { demoCatalog } = await import("../../src/services/demo/catalog.service.ts");
const now = new Date("2026-10-11T12:00:00Z");
const campaign = {
  id: "ad",
  placement: "Home banner",
  status: "active",
  startDate: "2026-10-01",
  endDate: "2026-10-11",
};
const ad = { id: "ad-item", type: "sponsored", sponsored: true, campaignId: "ad", active: true };
const video = {
  id: "video",
  type: "video",
  active: true,
  mediaSource: "/media/demo/flower.webm",
  transcript: "Silent flowers",
};
test("active Home ad campaign and a playable described video lead the feed, never unsupported cards", () => {
  const items = [video, { id: "highlight", type: "highlight", active: true }, ad];
  assert.deepEqual(
    selectFeatured(items, [campaign], now).map((item) => item.id),
    ["ad-item", "video"],
  );
  assert.equal(items[0].id, "video");
});
test("absent/draft/future/expired/wrong-placement/invalid campaigns and inactive media leave no ad slots", () => {
  for (const ads of [
    [],
    [{ ...campaign, status: "draft" }],
    [{ ...campaign, placement: "Marketplace" }],
    [{ ...campaign, startDate: "2026-10-12" }],
    [{ ...campaign, endDate: "2026-10-10" }],
    [{ ...campaign, startDate: "bad" }],
    [{ ...campaign, endDate: "2026-02-30" }],
  ])
    assert.deepEqual(selectFeatured([ad], ads, now), []);
  for (const item of [
    { ...ad, active: false },
    { ...video, active: false },
    { ...video, transcript: "" },
    { ...video, mediaSource: undefined },
  ])
    assert.deepEqual(selectFeatured([item], [campaign], now), []);
  assert.equal(selectFeatured([ad], [campaign], new Date("2026-10-12T00:00:00Z")).length, 0);
});
test("event/deadline previews include today, omit expired/malformed dates and sort chronologically", () => {
  const events = [
    { id: "later", date: "2026-10-15" },
    { id: "past", date: "2026-10-10" },
    { id: "bad", date: "2026-02-30" },
    { id: "today", date: "2026-10-11" },
  ];
  assert.deepEqual(
    upcomingEvents(events, now).map((item) => item.id),
    ["today", "later"],
  );
  assert.deepEqual(
    openOpportunities(
      events.map((item) => ({ ...item, deadline: item.date })),
      now,
    ).map((item) => item.id),
    ["today", "later"],
  );
  assert.equal(events[0].id, "later");
});
test("featured schema rejects unapproved destinations/media and malformed active flags", async () => {
  const { items } = await demoCatalog.list("featured");
  assert.equal(items.length, 2);
  for (const item of items) assert.equal(featuredSchema.safeParse(item).success, true);
  const base = items[0];
  for (const destination of [
    "https://evil.example/",
    "//evil.example/",
    "/../auth",
    "javascript:alert(1)",
  ])
    assert.equal(featuredSchema.safeParse({ ...base, destination }).success, false);
  for (const thumbnail of [
    "https://unapproved.example/image.jpg",
    "//evil.example/image.jpg",
    "/../private",
    "data:text/html,test",
  ])
    assert.equal(featuredSchema.safeParse({ ...base, thumbnail }).success, false);
  assert.equal(featuredSchema.safeParse({ ...base, active: "yes" }).success, false);
});

test("API event/campaign/deadline schemas reject impossible or malformed campus dates", async () => {
  const { entitySchemas } = await import("../../src/services/validation/catalog.schemas.ts");
  for (const [source, key] of [
    ["events", "date"],
    ["campaigns", "startDate"],
    ["opportunities", "deadline"],
  ]) {
    const { items } = await demoCatalog.list(source);
    for (const value of ["tomorrow", "2026-02-30", "2026-1-2", "2026-10-11T09:00:00Z"])
      assert.equal(entitySchemas[source].safeParse({ ...items[0], [key]: value }).success, false);
  }
});
