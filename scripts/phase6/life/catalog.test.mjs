import assert from "node:assert/strict";
import test from "node:test";
import { demoCatalog } from "../../../src/services/demo/catalog.service.ts";
import { entitySchemas } from "../../../src/services/validation/catalog.schemas.ts";
import { listingDetailsSchema } from "../../../src/services/validation/listing.schema.ts";
import { createDiscoverCatalog } from "../../../src/services/discover/catalog.service.ts";
test("12 fictional accommodation records preserve original h1/h2 fields and validate optional-rich galleries", async () => {
  const result = await demoCatalog.list("accommodation", { pageSize: 30 });
  assert.equal(result.total, 12);
  for (const item of result.items)
    assert.equal(
      entitySchemas.accommodation.safeParse(item).success,
      true,
      item.title,
    );
  const a = result.items.find((i) => i.id === "h1"),
    b = result.items.find((i) => i.id === "h2");
  assert.equal(a.title, "CityGate Hostel");
  assert.equal(a.price, "GH₵ 2,800 / semester");
  assert.equal(b.price, "GH₵ 3,200 / semester");
  assert.deepEqual(a.facilities, ["Wi-Fi", "Study room", "Backup power"]);
  assert.ok(result.items.every((i) => i.details.gallery.length === 3));
});
test("listing schema rejects unapproved covers, oversized text, invalid numeric price and insecure application links", () => {
  const valid = {
    intro: "A useful fictional listing",
    body: ["A detailed fictional body"],
    gallery: [],
    kind: "Studio",
    owner: "Demo host",
    tags: [],
  };
  assert.equal(listingDetailsSchema.safeParse(valid).success, true);
  for (const extra of [
    { priceValue: -1 },
    { walkMinutes: 999 },
    { body: ["x".repeat(1501)] },
    { applicationUrl: "javascript:alert(1)" },
    { applicationUrl: "http://unsafe.test" },
    {
      gallery: [
        {
          src: "https://unapproved.invalid/x.jpg",
          alt: "Not approved",
          provenance: "upload",
        },
      ],
    },
  ])
    assert.equal(
      listingDetailsSchema.safeParse({ ...valid, ...extra }).success,
      false,
    );
});
test("housing source uses bounded typed reads, keeps safe detail routes and no invented legacy facts", async () => {
  const catalog = createDiscoverCatalog(demoCatalog);
  const section = await catalog.section("accommodation");
  assert.equal(section.page.items.length, 12);
  assert.ok(
    section.page.items.every((i) => i.href.startsWith("/accommodation/")),
  );
  const legacy = {
    id: "h-legacy",
    title: "Legacy home",
    location: "Supplied area",
    price: "Price on request",
    facilities: [],
  };
  assert.equal(entitySchemas.accommodation.safeParse(legacy).success, true);
  assert.equal(
    await catalog.get({ category: "accommodation", id: "missing" }),
    null,
  );
});

test("12 marketplace records keep original titles/prices and labelled illustrative galleries", async () => {
  const page = await demoCatalog.list("marketplace", { pageSize: 30 });
  assert.equal(page.total, 12);
  for (const item of page.items)
    assert.equal(entitySchemas.marketplace.safeParse(item).success, true);
  assert.equal(page.items.find((i) => i.id === "mk1").priceLabel, "GH₵ 40");
  assert.equal(page.items.find((i) => i.id === "mk2").priceLabel, "GH₵ 25");
});

test("12 opportunities preserve original provider/deadline and include honest closed and optional eligibility states", async () => {
  const page = await demoCatalog.list("opportunities", { pageSize: 30 });
  assert.equal(page.total, 12);
  for (const item of page.items)
    assert.equal(entitySchemas.opportunities.safeParse(item).success, true);
  const first = page.items.find((i) => i.id === "o1");
  assert.equal(first.provider, "MTN Ghana");
  assert.equal(first.deadline, "2026-11-01");
  assert.ok(page.items.find((i) => i.id === "o12").deadline < "2026-10-11");
  assert.ok(first.details.eligibility.length > 0);
});

test("12 lost/found reports keep original records, validated states and board-only destinations", async () => {
  const raw = await demoCatalog.list("lostFound", { pageSize: 30 });
  assert.equal(raw.total, 12);
  assert.equal(
    raw.items.find((i) => i.id === "lf1").item,
    "Black HP laptop sleeve",
  );
  for (const item of raw.items)
    assert.equal(entitySchemas.lostFound.safeParse(item).success, true);
  const section =
    await createDiscoverCatalog(demoCatalog).section("lost-found");
  assert.ok(
    section.page.items.every(
      (i) => i.destination === "board" && i.href === "/lost-and-found",
    ),
  );
});

test("12 academic resources retain original IDs/course/download metadata without inventing actual file delivery", async () => {
  const page = await demoCatalog.list("resources", { pageSize: 30 });
  assert.equal(page.total, 12);
  for (const item of page.items)
    assert.equal(entitySchemas.resources.safeParse(item).success, true);
  assert.equal(
    page.items.find((i) => i.id === "r1").url,
    "https://example.com/resources/agile-notes.pdf",
  );
  assert.equal(page.items.find((i) => i.id === "r2").downloadable, false);
});
test("GPA weights actual credits and gives no result for an empty term", async () => {
  const { weightedGpa } = await import("../../../src/lib/academics/gpa.ts");
  assert.deepEqual(weightedGpa([]), { credits: 0, quality: 0, gpa: null });
  const rows = [
    { credits: 3, points: 4 },
    { credits: 1, points: 2 },
  ];
  assert.deepEqual(weightedGpa(rows), { credits: 4, quality: 14, gpa: 3.5 });
  assert.equal(weightedGpa([{ credits: 4, points: 0 }]).gpa, 0);
});
