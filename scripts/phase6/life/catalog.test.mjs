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
