import test from "node:test";
import assert from "node:assert/strict";
const { createHomeFeedService } = await import("../../src/services/home/home.service.ts");
const { demoCatalog } = await import("../../src/services/demo/catalog.service.ts");
const sources = [
  "featured",
  "clubs",
  "events",
  "opportunities",
  "campaigns",
  "timetable",
  "courses",
];
test("development-only Home fixtures are explicit, bounded and recover through the same feed contract", async () => {
  const { createHomePreviewService } = await import(
    "../../src/services/demo/home-preview.service.ts"
  );
  const base = createHomeFeedService(demoCatalog);
  for (const mode of ["empty", "offline", "partial", "inactive", "truncated"]) {
    const feed = await createHomePreviewService(base, mode).snapshot();
    if (mode === "empty") {
      assert.equal(feed.featured.length, 0);
      assert.deepEqual(feed.unavailable, []);
    }
    if (mode === "offline") assert.deepEqual(feed.unavailable, sources);
    if (mode === "partial") assert.deepEqual(feed.unavailable, ["featured", "timetable"]);
    if (mode === "inactive") assert.ok(feed.featured.every((item) => !item.active));
    if (mode === "truncated") assert.deepEqual(feed.truncated, ["clubs", "timetable"]);
  }
  const run = `native-${Date.now()}`;
  assert.ok((await createHomePreviewService(base, "recover", run).snapshot()).unavailable.length);
  assert.deepEqual(
    (await createHomePreviewService(base, "recover", run).snapshot()).unavailable,
    [],
  );
});
