import assert from "node:assert/strict";
import test from "node:test";
import { createDiscoverCatalog } from "../../../src/services/discover/catalog.service.ts";
import { demoCatalog } from "../../../src/services/demo/catalog.service.ts";
import { sections } from "./native-helpers.mjs";
test("eight catalog sources start concurrently with 30-record bounds, session headers and abort signals", async () => {
  let release;
  const gate = new Promise((resolve) => (release = resolve)),
    calls = [];
  const catalog = {
    ...demoCatalog,
    async list(collection, query) {
      calls.push({ collection, query });
      await gate;
      return demoCatalog.list(collection, query);
    },
  };
  const pending = createDiscoverCatalog(catalog).snapshot({
    headers: { Cookie: "campus_session=fixture" },
  });
  assert.equal(calls.length, 8);
  for (const { query } of calls) {
    assert.equal(query.pageSize, 30);
    assert.equal(query.page, 1);
    assert.ok(query.signal instanceof AbortSignal);
    assert.equal(query.headers.Cookie, "campus_session=fixture");
  }
  release();
  const result = await pending;
  assert.equal(result.sections.length, 8);
  assert.ok(result.sections.every((s) => s.page));
});
test("partial and complete source failures never masquerade as empty/demo success; per-source retry recovers", async () => {
  let fail = true;
  const catalog = {
    ...demoCatalog,
    async list(collection, query) {
      if (fail && collection === "events")
        throw new Error("Events unavailable");
      return demoCatalog.list(collection, query);
    },
  };
  const service = createDiscoverCatalog(catalog),
    snapshot = await service.snapshot();
  assert.equal(
    snapshot.sections.find((s) => s.category === "events").page,
    null,
  );
  assert.ok(snapshot.sections.filter((s) => s.page).length === 7);
  fail = false;
  assert.equal((await service.section("events")).page.total, 16);
  const all = await createDiscoverCatalog({
    ...catalog,
    list: async () => {
      throw new Error("No source");
    },
  }).snapshot();
  assert.ok(
    all.sections.every((s) => s.page === null && s.error === "No source"),
  );
});
test("caller cancellation rejects while deadlines remain unavailable sources, not demo substitution", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    createDiscoverCatalog(demoCatalog).snapshot({ signal: controller.signal }),
    (e) => e.name === "AbortError",
  );
  const hanging = {
    ...demoCatalog,
    list: (_name, query) =>
      new Promise((resolve, reject) =>
        query.signal.addEventListener(
          "abort",
          () => reject(query.signal.reason),
          { once: true },
        ),
      ),
  };
  const live = new AbortController(),
    work = createDiscoverCatalog(hanging).snapshot({ signal: live.signal });
  live.abort();
  await assert.rejects(work, (e) => e.name === "AbortError");
  const deadline = setTimeout(() => {}, 100);
  try {
    const result = await createDiscoverCatalog(hanging, 5).section("events");
    assert.equal(result.page, null);
    assert.ok(result.error);
  } finally {
    clearTimeout(deadline);
  }
});
test("bounded headers/page/IDs/schema prevent inconsistent pages and incorrect lookup results", async () => {
  const source = sections.find((s) => s.category === "events").page;
  for (const page of [
    { ...source, page: 2 },
    { ...source, pageSize: 100 },
    { ...source, items: [...source.items, ...source.items] },
    { ...source, total: NaN },
  ]) {
    const result = await createDiscoverCatalog({
      ...demoCatalog,
      list: async () => page,
    }).section("events");
    assert.equal(result.page, null);
  }
  await assert.rejects(
    createDiscoverCatalog(demoCatalog).section("events", 0),
    /Invalid/,
  );
  await assert.rejects(
    createDiscoverCatalog({
      ...demoCatalog,
      get: async () => ({ id: "wrong" }),
    }).get({ category: "events", id: "e1" }),
    /different campus item/,
  );
  await assert.rejects(
    createDiscoverCatalog(demoCatalog).get({ category: "events", id: "a/b" }),
  );
  assert.equal(
    await createDiscoverCatalog(demoCatalog).get({
      category: "events",
      id: "missing",
    }),
    null,
  );
});
test("legacy event facts stay missing; unapproved media uses an explicitly illustrative safe cover, never its URL", async () => {
  const original = await demoCatalog.get("events", "e1");
  delete original.details;
  const mapped = await createDiscoverCatalog({
    ...demoCatalog,
    get: async () => original,
  }).get({ category: "events", id: "e1" });
  assert.equal(mapped.illustrative, true);
  assert.equal(
    mapped.facts.find((f) => f.label === "Fee").value,
    "Price not supplied",
  );
  assert.equal(mapped.event.startsAt, undefined);
  const media = await demoCatalog.get("media", "md1");
  media.thumbnail = "https://unapproved.invalid/track.jpg";
  const safe = await createDiscoverCatalog({
    ...demoCatalog,
    get: async () => media,
  }).get({ category: "media", id: "md1" });
  assert.equal(safe.illustrative, true);
  assert.ok(safe.cover.src.startsWith("/images/demo/"));
  assert.equal(safe.href, "/media");
});
