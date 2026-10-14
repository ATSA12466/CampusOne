import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.CAMPUSONE_DATA_DIR = mkdtempSync(join(tmpdir(), "campusone-admin-"));
const { resetStoreCache } = await import("../../src/server/store.ts");
const { adminRegistry } = await import("../../src/server/admin.ts");
const { registerUser } = await import("../../src/server/auth.ts");
resetStoreCache();

const by = { id: "u-admin", name: "Admin User" };

test("branding drafts publish and roll back with versions", async () => {
  const initial = adminRegistry.getPublishedBranding();
  assert.equal(initial.displayName, "CampusOne");
  await adminRegistry.saveDraft({ displayName: "CampusOne Test", tagline: "Hello", colors: { brand: "#1769AA", brandInk: "#123B63", accent: "#F5B82E", cream: "#FFF8E7" } }, by.id);
  assert.equal(adminRegistry.getPublishedBranding().displayName, "CampusOne");
  assert.equal(adminRegistry.getDraftBranding().displayName, "CampusOne Test");
  const { live, version } = await adminRegistry.publishDraft(by);
  assert.equal(live.displayName, "CampusOne Test");
  assert.equal(version.publishedByName, "Admin User");
  await adminRegistry.saveDraft({ displayName: "Broken Edit", colors: { brand: "#1769AA", brandInk: "#123B63", accent: "#F5B82E", cream: "#FFF8E7" } }, by.id);
  await adminRegistry.publishDraft(by);
  const rolled = await adminRegistry.rollback(version.id, by);
  assert.equal(rolled?.displayName, "CampusOne Test");
  assert.equal(adminRegistry.listVersions().length, 3);
  assert.equal(await adminRegistry.rollback("missing", by), null);
  await assert.rejects(() => adminRegistry.saveDraft({ displayName: "x", colors: { brand: "nope", brandInk: "#123B63", accent: "#F5B82E", cream: "#FFF8E7" } }, by.id));
});

test("listings stay hidden until approved", async () => {
  const item = await adminRegistry.submitListing(
    { title: "Sunny Hostel Room", area: "Tesano", price: 4500, period: "semester", beds: 2, description: "A bright, airy room ten minutes from the GCTU gate.", contact: "024 000 0000" },
    by,
  );
  assert.equal(item.status, "pending");
  assert.equal(adminRegistry.approvedListings().length, 0);
  await adminRegistry.decideListing(item.id, { status: "approved", note: "Visited." }, by.id);
  assert.equal(adminRegistry.approvedListings().length, 1);
  assert.equal(await adminRegistry.decideListing("missing", { status: "approved" }, by.id), null);
});

test("reports triage and materials curate", async () => {
  const report = await adminRegistry.submitReport(
    { targetType: "post", targetId: "p1", reason: "Spam content" },
    by,
  );
  assert.equal(report.status, "open");
  const triaged = await adminRegistry.triageReport(report.id, { status: "actioned", resolution: "Removed." });
  assert.equal(triaged?.status, "actioned");
  const material = await adminRegistry.createMaterial(
    { title: "CS 201 Notes", course: "CS 201", kind: "note", status: "draft" },
    by,
  );
  assert.equal(adminRegistry.listMaterials("published").length, 0);
  await adminRegistry.updateMaterial(material.id, { ...material, status: "published" });
  assert.equal(adminRegistry.listMaterials("published").length, 1);
  assert.equal(await adminRegistry.deleteMaterial(material.id), 1);
});

test("settings save and users update", async () => {
  await adminRegistry.saveSetting("supportEmail", "help@campusone.app", by.id);
  assert.equal(adminRegistry.getSettings().supportEmail, "help@campusone.app");
  const { user } = await registerUser({ name: "Staff Member", email: "staff@example.edu.gh", password: "staff-pass-01" });
  const updated = await adminRegistry.updateUser(user.id, { verifiedStudent: true, roles: ["student", "moderator"] });
  assert.equal(updated?.verifiedStudent, true);
  assert.deepEqual(updated?.roles, ["student", "moderator"]);
  const suspended = await adminRegistry.updateUser(user.id, { status: "suspended" });
  assert.equal(suspended?.status, "suspended");
  assert.equal(await adminRegistry.updateUser("missing", { status: "active" }), null);
});
