import assert from "node:assert/strict";
import test from "node:test";
import { stat } from "node:fs/promises";
import { clubCategoryLabel } from "../../../src/lib/clubs/category.ts";
import { demoCatalog } from "../../../src/services/demo/catalog.service.ts";
import { clubDirectory, clubPageSize } from "../../../src/lib/clubs/directory.ts";
import { clubCover, clubGallery, clubFee } from "../../../src/lib/clubs/media.ts";
import { clubCatalogService } from "../../../src/services/clubs/catalog.service.ts";
import { imageForSrc } from "../../../src/config/images.ts";
const filter = { query: "", category: "all", sort: "recommended", view: "all", page: 1 };
const activity = { memberships: [], savedIds: [], userId: "user-1" };
const { page: catalog } = await clubCatalogService.list();
const clubs = catalog.items;
test("sixteen service-provided fictional communities preserve legacy IDs and registered meaningful photography", async () => {
  assert.equal(clubs.length, 16);
  assert.equal(new Set(clubs.map((club) => club.id)).size, 16);
  assert.equal(clubs.find((club) => club.id === "club-1").name, "Code Collective");
  assert.equal(clubs.find((club) => club.id === "club-2").name, "Debate Assembly");
  for (const club of clubs) {
    assert.equal(clubCover(club).provenance, "generated");
    assert.ok(clubCover(club).alt.length > 20);
    assert.equal(clubGallery(club).length, 3);
    assert.ok(
      club.details.story.some((text) => text.includes("fictional") || text.includes("Demo")),
    );
  }
  for (const src of [...new Set(clubs.map((club) => club.cover))]) {
    assert.ok(imageForSrc(src).blurDataURL?.startsWith("data:image/"));
    assert.ok((await stat(`public${src}`)).size < 150000);
  }
});
test("directory paginates six per page with unique records and clamped/invalid pages", () => {
  assert.equal(clubPageSize, 6);
  const pages = [1, 2, 3].map((page) => clubDirectory(clubs, { ...filter, page }, activity));
  assert.deepEqual(
    pages.map((result) => result.items.length),
    [6, 6, 4],
  );
  assert.equal(pages[0].total, 16);
  assert.equal(new Set(pages.flatMap((p) => p.items.map((c) => c.id))).size, 16);
  assert.equal(clubDirectory(clubs, { ...filter, page: 100 }, activity).page, 3);
  assert.equal(clubDirectory(clubs, { ...filter, page: NaN }, activity).page, 1);
  assert.equal(clubDirectory(clubs, { ...filter, page: -2 }, activity).page, 1);
});
test("search trims/folds case and diacritics, finds objectives/venues, and honors interest filters", () => {
  assert.equal(
    clubDirectory(clubs, { ...filter, query: "  CÓDE   " }, activity).items[0].id,
    "club-1",
  );
  assert.ok(
    clubDirectory(clubs, { ...filter, query: "mentor freshers" }, activity).items.some(
      (club) => club.id === "club-1",
    ),
  );
  assert.ok(
    clubDirectory(clubs, { ...filter, query: "innovation lab" }, activity).items.some(
      (club) => club.id === "club-1",
    ),
  );
  for (const category of new Set(clubs.map((club) => clubCategoryLabel(club.category)))) {
    const r = clubDirectory(clubs, { ...filter, category }, activity);
    assert.equal(
      r.total,
      clubs.filter((club) => clubCategoryLabel(club.category) === category).length,
    );
    assert.ok(r.items.every((club) => clubCategoryLabel(club.category) === category));
  }
  assert.equal(clubDirectory(clubs, { ...filter, query: "no-such-club" }, activity).total, 0);
});
test("name, featured and member sorting are deterministic without mutating source", () => {
  const before = structuredClone(clubs),
    names = clubDirectory(clubs, { ...filter, sort: "name" }, activity).items.map((c) => c.name);
  assert.deepEqual(
    names,
    [...clubs]
      .sort((a, b) => a.name.localeCompare(b.name, "en-GH"))
      .slice(0, 6)
      .map((c) => c.name),
  );
  const members = clubDirectory(clubs, { ...filter, sort: "members" }, activity).items.map(
    (c) => c.details.memberCount,
  );
  assert.deepEqual(
    members,
    [...members].sort((a, b) => b - a),
  );
  assert.equal(clubDirectory(clubs, filter, activity).items[0].id, "club-1");
  assert.deepEqual(clubs, before);
});
test("my/saved filters isolate ownership, include pending/approved but not rejected and compose with search", () => {
  const own = {
    ...activity,
    savedIds: ["club-3", "club-5"],
    memberships: [
      { clubId: "club-1", userId: "user-1", status: "approved" },
      { clubId: "club-2", userId: "user-1", status: "pending" },
      { clubId: "club-3", userId: "other", status: "approved" },
      { clubId: "club-4", userId: "user-1", status: "rejected" },
    ],
  };
  assert.deepEqual(
    clubDirectory(clubs, { ...filter, view: "mine" }, own).items.map((c) => c.id),
    ["club-1", "club-2"],
  );
  assert.equal(clubDirectory(clubs, { ...filter, view: "saved" }, own).total, 2);
  assert.equal(clubDirectory(clubs, { ...filter, view: "saved", query: "Robotics" }, own).total, 1);
});
test("legacy detail absence is truthful; Ghana cedi fee formatting and approved media retain a safe contract", () => {
  const { details, ...legacy } = clubs[0];
  assert.equal(clubFee(legacy), "Fee not supplied");
  assert.deepEqual(clubGallery(legacy), []);
  assert.equal(clubFee(clubs[0]), "Free to join");
  assert.match(clubFee(clubs.find((c) => c.id === "club-3")), /GH₵20/);
  assert.equal(clubCover({ ...legacy, cover: "/images/custom.webp" }).provenance, "upload");
  assert.ok(!clubCover(legacy).alt.includes("actual GCTU"));
});

test("legacy service category identifiers remain queryable while the UI groups seven readable interests", async () => {
  assert.equal((await demoCatalog.list("clubs", { category: "technology" })).items[0].id, "club-1");
  assert.equal(
    (await demoCatalog.list("clubs", { category: "public-speaking" })).items[0].id,
    "club-2",
  );
  assert.equal(new Set(clubs.map((club) => clubCategoryLabel(club.category))).size, 7);
});
