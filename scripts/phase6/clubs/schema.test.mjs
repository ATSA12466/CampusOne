import assert from "node:assert/strict";
import test from "node:test";
import { engagementSchemas } from "../../../src/services/validation/engagement.schemas.ts";
import {
  clubDetailsSchema,
  clubActivitySchema,
  membershipNoteSchema,
} from "../../../src/services/validation/club.schema.ts";
import { membershipRequestSchema } from "../../../src/features/clubs/validation/request.schema.ts";
import { clubCatalogService } from "../../../src/services/clubs/catalog.service.ts";
const club = await clubCatalogService.get("club-1");
test("optional rich club DTOs validate without making legacy fields mandatory", () => {
  assert.equal(engagementSchemas.clubs.safeParse(club).success, true);
  const { details, ...legacy } = club;
  assert.equal(engagementSchemas.clubs.safeParse(legacy).success, true);
  assert.equal(
    engagementSchemas.clubs.safeParse({ ...legacy, cover: "javascript:alert(1)" }).success,
    false,
  );
});
test("rich DTO rejects unsupported media, transient blobs, invalid counts/fees and oversized arrays", () => {
  for (const patch of [
    { memberCount: -1 },
    { memberCount: 1.2 },
    { fee: -20 },
    { coverAlt: "bad" },
    { gallery: [{ src: "https://unapproved.example/x.webp", alt: "A meaningful photo" }] },
    { gallery: [{ src: "blob:transient", alt: "A meaningful photo" }] },
    { leaders: Array(13).fill({ name: "Name", role: "Role" }) },
  ])
    assert.equal(clubDetailsSchema.safeParse({ ...club.details, ...patch }).success, false);
});
test("activity is typed and bounded; unknown membership status and dates cannot enter UI", () => {
  assert.equal(
    clubActivitySchema.safeParse({
      memberships: [
        {
          id: "m1",
          clubId: "club-1",
          userId: "user-1",
          status: "approved",
          requestedAt: "2026-10-11",
        },
      ],
      savedIds: ["club-1"],
    }).success,
    true,
  );
  for (const payload of [
    { memberships: [], savedIds: Array(501).fill("club-1") },
    {
      memberships: [{ id: "m1", clubId: "club-1", userId: "user-1", status: "owner" }],
      savedIds: [],
    },
  ])
    assert.equal(clubActivitySchema.safeParse(payload).success, false);
});
test("400-character optional introduction validates before service; explicit acknowledgement is required", () => {
  assert.equal(membershipNoteSchema.parse("  Hello Ghana  "), "Hello Ghana");
  assert.equal(membershipNoteSchema.safeParse("x".repeat(400)).success, true);
  assert.equal(membershipNoteSchema.safeParse("x".repeat(401)).success, false);
  assert.equal(membershipNoteSchema.safeParse("hello\u0000world").success, false);
  assert.equal(membershipRequestSchema.safeParse({ note: "", acknowledged: false }).success, false);
  assert.equal(membershipRequestSchema.safeParse({ note: "", acknowledged: true }).success, true);
});
