import test from "node:test";
import assert from "node:assert/strict";
const { searchQuerySchema } = await import("../../src/services/validation/search.schema.ts");
const { normalizeSearch, rankSearchResults } = await import("../../src/lib/search/rank.ts");
const { createSearchService } = await import("../../src/services/search/search.service.ts");
const { demoCatalog } = await import("../../src/services/demo/catalog.service.ts");
const result = (title) => ({
  id: title,
  title,
  description: "",
  group: "Clubs",
  icon: "clubs",
  href: "/clubs/club-1",
});
const search = createSearchService(demoCatalog);
test("search validates trimmed query, scopes and bounded integer limits", () => {
  assert.deepEqual(searchQuerySchema.parse({ query: "  Code  " }), {
    query: "Code",
    scope: "all",
    limit: 18,
  });
  for (const input of [
    { query: "x".repeat(101) },
    { query: "x", scope: "invalid" },
    { query: "x", limit: 0 },
    { query: "x", limit: 31 },
    { query: "x", limit: 1.5 },
  ])
    assert.equal(searchQuerySchema.safeParse(input).success, false);
});
test("ranking is accent-insensitive, exact then prefix then title then body, non-mutating", () => {
  const input = [
    result("Student code notes"),
    result("A study resource"),
    result("Code Collective"),
    result("Code"),
  ];
  const original = input.map((item) => item.title);
  assert.deepEqual(
    rankSearchResults(input, "code").map((item) => item.title),
    ["Code", "Code Collective", "Student code notes", "A study resource"],
  );
  assert.deepEqual(
    input.map((item) => item.title),
    original,
  );
  assert.equal(normalizeSearch("ÉCOLE"), "ecole");
});
test("empty and one-character suggestions never fetch content; exact pages rank first", async () => {
  let calls = 0;
  const fake = {
    ...demoCatalog,
    list() {
      calls++;
      throw new Error("should not fetch");
    },
  };
  const service = createSearchService(fake);
  const suggestions = await service.search({ query: "" });
  assert.equal(suggestions.items.length, 18);
  assert.equal(suggestions.items[0].href, "/home");
  assert.equal(suggestions.hasMore, true);
  await service.search({ query: "c" });
  assert.equal(calls, 0);
  const pages = await search.search({ query: "Clubs", scope: "destinations" });
  assert.equal(pages.items[0].href, "/clubs");
  assert.equal(pages.items[0].group, "Pages");
});
test("all seven source mappings reach their existing detail routes", async () => {
  for (const [scope, query, href] of [
    ["clubs", "Code", "/clubs/club-1"],
    ["events", "Innovation", "/events/e1"],
    ["opportunities", "MTN", "/opportunities/o1"],
    ["accommodation", "CityGate", "/accommodation/h1"],
    ["marketplace", "Figma", "/marketplace/mk1"],
    ["resources", "Agile", "/academics/resources/r1"],
    ["announcements", "extension", "/announcements/a1"],
  ]) {
    const response = await search.search({ query, scope });
    assert.equal(response.items[0].href, href, scope);
    assert.deepEqual(response.unavailable, []);
  }
  assert.equal((await search.search({ query: "no-campus-match-xyz" })).items.length, 0);
});
test("scoping, six-per-source limits, signals and headers pass through the catalog boundary", async () => {
  const calls = [];
  const controller = new AbortController();
  const headers = { "X-Campus-Test": "present" };
  const fake = {
    ...demoCatalog,
    async list(collection, options) {
      calls.push({ collection, options });
      return demoCatalog.list(collection, options);
    },
  };
  await createSearchService(fake).search({
    query: "Code",
    scope: "clubs",
    signal: controller.signal,
    headers,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].collection, "clubs");
  assert.equal(calls[0].options.pageSize, 6);
  assert.equal(calls[0].options.signal, controller.signal);
  assert.equal(calls[0].options.headers, headers);
  const limited = await search.search({ query: "c", limit: 1 });
  assert.equal(limited.items.length, 1);
  assert.equal(limited.hasMore, true);
});
test("partial and complete content failures preserve page shortcuts and retry can recover", async () => {
  let offline = true;
  const fake = {
    ...demoCatalog,
    async list(collection, options) {
      if (offline && collection === "clubs") throw new Error("offline");
      return demoCatalog.list(collection, options);
    },
  };
  const service = createSearchService(fake);
  const partial = await service.search({ query: "Code" });
  assert.deepEqual(partial.unavailable, ["clubs"]);
  offline = false;
  assert.equal((await service.search({ query: "Code" })).items[0].href, "/clubs/club-1");
  const unavailable = await createSearchService({
    ...demoCatalog,
    list() {
      return Promise.reject(new Error("offline"));
    },
  }).search({ query: "Clubs" });
  assert.equal(unavailable.unavailable.length, 7);
  assert.equal(unavailable.items[0].href, "/clubs");
});
test("pre-aborted and mid-flight cancellation reject rather than masquerading as source errors", async () => {
  const before = new AbortController();
  before.abort();
  await assert.rejects(search.search({ query: "Code", signal: before.signal }), {
    name: "AbortError",
  });
  const mid = new AbortController();
  const fake = {
    ...demoCatalog,
    list() {
      return new Promise((resolve, reject) =>
        mid.signal.addEventListener(
          "abort",
          () => reject(new DOMException("cancelled", "AbortError")),
          { once: true },
        ),
      );
    },
  };
  const pending = createSearchService(fake).search({ query: "Code", signal: mid.signal });
  mid.abort();
  await assert.rejects(pending, { name: "AbortError" });
});
test("source result IDs are URL encoded and upstream hasMore remains visible", async () => {
  const club = await demoCatalog.get("clubs", "club-1");
  const fake = {
    ...demoCatalog,
    async list() {
      return {
        items: [{ ...club, id: "club/id with space" }],
        page: 1,
        pageSize: 6,
        total: 8,
        hasMore: true,
      };
    },
  };
  const page = await createSearchService(fake).search({ query: "Code", scope: "clubs" });
  assert.equal(page.items[0].href, "/clubs/club%2Fid%20with%20space");
  assert.equal(page.hasMore, true);
});
test("development preview fixtures fail once, recover on retry and retain truthful source failures", async () => {
  const { createSearchPreviewService } = await import(
    "../../src/services/demo/search-preview.service.ts"
  );
  const error = createSearchPreviewService(search, "error");
  await assert.rejects(error.search({ query: "" }), /Controlled showcase failure/);
  assert.equal((await error.search({ query: "" })).items.length, 18);
  const partial = createSearchPreviewService(search, "partial");
  assert.deepEqual((await partial.search({ query: "" })).unavailable, ["clubs"]);
  assert.deepEqual((await partial.search({ query: "" })).unavailable, []);
});
