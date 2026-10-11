import assert from "node:assert/strict";
import test from "node:test";
import {
  discoverItemSchema,
  discoverActivitySchema,
  discoverReferenceSchema,
  discoverAckSchema,
} from "../../../src/services/validation/discover.schema.ts";
import {
  discoverFilterSchema,
  readDiscoverFilter,
  filterFromParams,
  filterParams,
} from "../../../src/features/discover/validation/filter.schema.ts";
import { discoverSavedFromBookmarks } from "../../../src/lib/discover/bookmarks.ts";
import {
  discoverBookmarkTypes,
  discoverCategories,
} from "../../../src/config/discover.ts";
import { items, filter, find } from "./native-helpers.mjs";
test("all 45 mapped DTOs have bounded fields, approved meaningful covers and existing safe destinations", () => {
  for (const item of items) {
    assert.equal(discoverItemSchema.safeParse(item).success, true, item.title);
    assert.ok(item.cover.alt.length >= 8);
    assert.ok(item.href.startsWith("/"));
  }
  assert.equal(find("lost-found", "lf1").destination, "board");
  assert.equal(find("lost-found", "lf1").href, "/lost-and-found");
  assert.equal(find("media", "md1").destination, "library");
  assert.equal(find("media", "md1").href, "/media");
  assert.equal(find("accommodation", "h1").illustrative, true);
  assert.equal(
    find("marketplace", "mk1").facts.find((f) => f.label === "Listed price")
      .value,
    "GH₵ 40",
  );
  assert.ok(Buffer.byteLength(JSON.stringify(items)) < 60000);
});
test("unsafe source IDs, images, titles and extra-large activity never enter discovery", () => {
  for (const id of [
    "",
    " ",
    ".",
    "..",
    "a/b",
    "a\\b",
    "a#b",
    "a\u0000",
    "x".repeat(101),
  ])
    assert.equal(
      discoverReferenceSchema.safeParse({ category: "events", id }).success,
      false,
      id,
    );
  for (const update of [
    { title: "x".repeat(241) },
    {
      cover: { ...items[0].cover, src: "https://unapproved.invalid/photo.jpg" },
    },
    { cover: { ...items[0].cover, src: "blob:local" } },
    { href: "javascript:alert(1)" },
    { facts: Array(4).fill({ label: "Fact", value: "Value" }) },
  ])
    assert.equal(
      discoverItemSchema.safeParse({ ...items[0], ...update }).success,
      false,
    );
  assert.equal(
    discoverActivitySchema.safeParse({
      saved: Array(501).fill({ category: "events", id: "e1" }),
    }).success,
    false,
  );
  assert.equal(
    discoverActivitySchema.safeParse({
      saved: [{ category: "unknown", id: "e1" }],
    }).success,
    false,
  );
  assert.equal(discoverAckSchema.safeParse({ ok: false }).success, false);
});
test("filter URLs round-trip query/category/view/sort/page; malformed external state resets safely", () => {
  const value = {
    query: "Créative people & projects",
    category: "clubs",
    view: "saved",
    sort: "name",
    page: 2,
  };
  assert.deepEqual(filterFromParams(filterParams(value)), value);
  assert.deepEqual(readDiscoverFilter({ query: "x".repeat(121) }), filter);
  for (const input of [
    { category: "missing" },
    { page: -1 },
    { page: 1.5 },
    { page: 100001 },
    { view: "private-role" },
    { sort: "trending" },
  ])
    assert.equal(discoverFilterSchema.safeParse(input).success, false);
  assert.deepEqual(
    filterFromParams(new URLSearchParams("category=events&view=all&page=3")),
    { ...filter, category: "events", view: "all", page: 3 },
  );
});
test("local saved conversion supports all eight categories without mixing same-ID records or unsupported bookmarks", () => {
  const bookmarks = discoverCategories.map((category) => ({
    id: category,
    entityId: "same",
    entityType: discoverBookmarkTypes[category],
  }));
  assert.equal(discoverSavedFromBookmarks(bookmarks).length, 8);
  assert.deepEqual(
    discoverSavedFromBookmarks([
      { id: "nope", entityId: "x", entityType: "announcement" },
    ]),
    [],
  );
  assert.deepEqual(discoverSavedFromBookmarks(null), []);
});

test("Discover sign-in returns use the existing path-only safety policy, never broaden redirects for filter queries", async () => {
  const { studentReturnPath } = await import(
    "../../../src/lib/auth/return-path.ts"
  );
  assert.equal(studentReturnPath("/discover"), "/discover");
  assert.equal(studentReturnPath("/discover?view=saved"), "/home");
});
