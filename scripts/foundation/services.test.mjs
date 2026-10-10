import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
const { demoCatalog } = await import("../../src/services/demo/catalog.service.ts");
const { entitySchemas } = await import("../../src/services/validation/catalog.schemas.ts");
const { createApiCatalog } = await import("../../src/services/api/catalog.service.ts");
const { apiClient, apiUrl, ApiError } = await import("../../src/services/api/client.ts");

test("all 17 demo collections satisfy their runtime contracts", async () => {
  assert.equal(Object.keys(entitySchemas).length, 17);
  for (const collection of Object.keys(entitySchemas)) {
    const page = await demoCatalog.list(collection);
    for (const item of page.items)
      assert.equal(
        entitySchemas[collection].safeParse(item).success,
        true,
        `${collection}:${item.id}`,
      );
    assert.ok(page.total >= page.items.length);
  }
});
test("typed demo search, category, pagination and missing details", async () => {
  const clubs = await demoCatalog.list("clubs", { search: "Code" });
  assert.equal(clubs.items.length, 1);
  assert.equal(clubs.items[0].id, "club-1");
  const events = await demoCatalog.list("events", { pageSize: 1 });
  assert.equal(events.items.length, 1);
  assert.equal(events.hasMore, true);
  const more = await demoCatalog.list("events", { pageSize: 1, page: 2 });
  assert.notEqual(more.items[0].id, events.items[0].id);
  assert.equal(
    (await demoCatalog.list("clubs", { category: "technology" })).items.every(
      (i) => i.category === "technology",
    ),
    true,
  );
  assert.equal(await demoCatalog.get("clubs", "missing"), null);
  const copied = await demoCatalog.get("clubs", "club-1");
  copied.name = "mutated";
  assert.notEqual((await demoCatalog.get("clubs", "club-1")).name, "mutated");
  await assert.rejects(demoCatalog.list("clubs", { page: 0 }));
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(demoCatalog.list("clubs", { signal: abort.signal }), { name: "AbortError" });
});
test("API URL is browser-relative, server port 4000, never path traversal", () => {
  assert.equal(apiUrl("/clubs"), "http://127.0.0.1:4000/api/clubs");
  globalThis.window = {};
  try {
    assert.equal(apiUrl("/clubs"), "/api/clubs");
    assert.throws(() => apiUrl("/clubs", "http://localhost:4000/api"), ApiError);
    assert.equal(apiUrl("/clubs?search=study..."), "/api/clubs?search=study...");
  } finally {
    delete globalThis.window;
  }
  for (const path of [
    "clubs",
    "//evil.example/",
    "/../secret",
    "/%2e%2e/secret",
    "/clubs/../../private",
  ])
    assert.throws(() => apiUrl(path), ApiError);
});
test("API client validates JSON, preserves caller headers and uses credentials", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  let options;
  globalThis.fetch = async (_url, init) => {
    options = init;
    return Response.json({ ok: true });
  };
  assert.deepEqual(
    await apiClient("/test", {
      schema: z.object({ ok: z.boolean() }),
      headers: { "X-Test": "yes" },
      body: JSON.stringify({ draft: true }),
      method: "POST",
    }),
    { ok: true },
  );
  assert.equal(options.credentials, "include");
  assert.equal(options.headers.get("X-Test"), "yes");
  assert.equal(options.headers.get("Content-Type"), "application/json");
  const form = new FormData();
  form.set("photo", new Blob(["photo"]));
  await apiClient("/test", { schema: z.object({ ok: z.boolean() }), body: form, method: "POST" });
  assert.equal(options.headers.has("Content-Type"), false);
  globalThis.fetch = async () => Response.json({ ok: "invalid" });
  await assert.rejects(
    apiClient("/test", { schema: z.object({ ok: z.boolean() }) }),
    (e) => e.code === "VALIDATION" && e.status === 502,
  );
  globalThis.fetch = async () => new Response("<html>not JSON</html>");
  await assert.rejects(
    apiClient("/test", { schema: z.object({ ok: z.boolean() }) }),
    (e) => e.code === "VALIDATION",
  );
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await apiClient("/test", { schema: z.undefined() }), undefined);
});
test("API HTTP/offline errors are friendly; aborted requests stay aborted", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  for (const status of [401, 404, 500]) {
    globalThis.fetch = async () => new Response("private upstream details", { status });
    await assert.rejects(
      apiClient("/test", { schema: z.object({}) }),
      (e) => e.status === status && !e.message.includes("private"),
    );
  }
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };
  await assert.rejects(
    apiClient("/test", { schema: z.object({}) }),
    (e) => e.code === "NETWORK" && e.status === 0,
  );
  globalThis.fetch = async () => {
    throw new DOMException("aborted", "AbortError");
  };
  await assert.rejects(apiClient("/test", { schema: z.object({}) }), { name: "AbortError" });
});
test("swappable API catalog encodes queries, validates pages and maps 404 to null", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  const club = await demoCatalog.get("clubs", "club-1");
  let url;
  globalThis.fetch = async (value) => {
    url = value;
    return Response.json({ items: [club], page: 1, pageSize: 1, total: 2 });
  };
  const api = createApiCatalog("https://api.example.org/api");
  const page = await api.list("clubs", { search: "code circle", pageSize: 1 });
  assert.equal(page.hasMore, true);
  assert.ok(url.includes("search=code+circle"));
  assert.equal(page.items[0].name, club.name);
  globalThis.fetch = async () => new Response(null, { status: 404 });
  assert.equal(await api.get("clubs", "missing"), null);
});
