import test from "node:test";
import assert from "node:assert/strict";
const { createHomeFeedService } = await import("../../src/services/home/home.service.ts");
const { demoCatalog } = await import("../../src/services/demo/catalog.service.ts");
const { sessionHeaders } = await import("../../src/services/api/session-headers.ts");
const sources = [
  "featured",
  "clubs",
  "events",
  "opportunities",
  "campaigns",
  "timetable",
  "courses",
];
const page = (items = [], hasMore = false) => ({
  items,
  page: 1,
  pageSize: 30,
  total: items.length,
  hasMore,
});
test("Home reads seven bounded sources concurrently through services and forwards cancellation/session headers", async () => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const calls = [];
  const controller = new AbortController(),
    headers = { Cookie: "session=fixture" };
  const catalog = {
    list: async (source, query) => {
      calls.push({ source, query });
      await gate;
      return page([], source === "events");
    },
  };
  const work = createHomeFeedService(catalog).snapshot({
    now: "2026-10-11T12:00:00Z",
    headers,
    signal: controller.signal,
  });
  assert.deepEqual(
    calls.map((call) => call.source),
    sources,
  );
  for (const { query } of calls) {
    assert.equal(query.pageSize, 30);
    assert.equal(query.headers, headers);
    assert.equal(query.signal.aborted, false);
  }
  release();
  const result = await work;
  assert.equal(result.now, "2026-10-11T12:00:00Z");
  assert.deepEqual(result.truncated, ["events"]);
  assert.deepEqual(result.unavailable, []);
});
test("partial/complete failures stay honest, do not substitute demos, and later retry recovers", async () => {
  let broken = true;
  const catalog = {
    list: async (source) => {
      if (broken && ["featured", "timetable"].includes(source))
        throw Error("Do not expose backend internals");
      return demoCatalog.list(source, { pageSize: 30 });
    },
  };
  const service = createHomeFeedService(catalog),
    first = await service.snapshot();
  assert.deepEqual(first.unavailable, ["featured", "timetable"]);
  assert.deepEqual(first.featured, []);
  assert.deepEqual(first.timetable, []);
  assert.ok(first.clubs.length);
  broken = false;
  assert.deepEqual((await service.snapshot()).unavailable, []);
  const failed = await createHomeFeedService({
    list: async () => {
      throw Error("Offline");
    },
  }).snapshot();
  assert.deepEqual(failed.unavailable, sources);
  for (const source of sources) assert.deepEqual(failed[source], []);
});
test("pre-aborted and in-flight caller cancellation reject instead of returning an empty success", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(createHomeFeedService(demoCatalog).snapshot({ signal: controller.signal }), {
    name: "AbortError",
  });
  const active = new AbortController();
  const catalog = {
    list: async (_source, query) =>
      new Promise((_resolve, reject) => {
        query.signal.addEventListener("abort", () => reject(query.signal.reason), { once: true });
      }),
  };
  const work = createHomeFeedService(catalog).snapshot({ signal: active.signal });
  active.abort();
  await assert.rejects(work, { name: "AbortError" });
});
test("bounded request deadlines degrade to unavailable sections, not caller cancellation or fallback data", async () => {
  const catalog = {
    list: async (_source, query) =>
      new Promise((_resolve, reject) => {
        const keepAlive = setTimeout(() => reject(Error("Deadline not applied")), 1000);
        query.signal.addEventListener(
          "abort",
          () => {
            clearTimeout(keepAlive);
            reject(query.signal.reason);
          },
          { once: true },
        );
      }),
  };
  const result = await createHomeFeedService(catalog, { timeoutMs: 5 }).snapshot();
  assert.deepEqual(result.unavailable, sources);
  assert.deepEqual(result.featured, []);
});
test("server forwards only exact allowlisted session cookies, no arbitrary cookies/headers or controls", () => {
  assert.deepEqual(
    sessionHeaders("analytics=private; session=abc%3D; __Host-auth=xyz; role=admin", [
      "session",
      " __Host-auth ",
    ]),
    { Cookie: "session=abc%3D; __Host-auth=xyz" },
  );
  assert.deepEqual(sessionHeaders("session=a; sessionId=b", ["sessionId"]), {
    Cookie: "sessionId=b",
  });
  for (const header of [null, "", "session=x\r\nHost: evil", "session=x\u007f"])
    assert.deepEqual(sessionHeaders(header, ["session"]), {});
  assert.deepEqual(sessionHeaders("session=x", []), {});
  assert.deepEqual(sessionHeaders("session=x", ["bad name"]), {});
});
