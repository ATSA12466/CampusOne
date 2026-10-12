import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.CAMPUSONE_DATA_DIR = mkdtempSync(join(tmpdir(), "campusone-registry-"));
const { resetStoreCache } = await import("../../src/server/store.ts");
const { registry } = await import("../../src/server/registry.ts");
resetStoreCache();

const by = { id: "u-admin", name: "Admin User" };

test("club registrations submit as pending and decide with notes", async () => {
  const item = await registry.submitClub(
    { name: "Test Club", category: "Technology", description: "A sufficiently long test description.", objectives: ["Learn"] },
    by,
  );
  assert.equal(item.status, "pending");
  assert.equal(registry.listClubs("pending").length, 1);
  const decided = await registry.decideClub(item.id, { status: "approved", note: "Great fit." }, by.id);
  assert.equal(decided?.status, "approved");
  assert.equal(decided?.note, "Great fit.");
  assert.equal(registry.listClubs("pending").length, 0);
  assert.equal(await registry.decideClub("missing", { status: "approved" }, by.id), null);
  await assert.rejects(() => registry.submitClub({ name: "x" }, by));
});

test("nominations and appointments keep an auditable trail", async () => {
  const nom = await registry.submitNomination(
    { clubId: "", clubName: "Test Club", position: "President", nomineeName: "Jane Doe", statement: "Ready to serve." },
    by,
  );
  assert.equal(nom.status, "pending");
  await registry.decideNomination(nom.id, { status: "approved" }, by.id);
  const appt = await registry.createAppointment(
    {
      scopeType: "club",
      scopeId: "club-1",
      scopeName: "Test Club",
      position: "President",
      appointeeName: "Jane Doe",
      startsAt: new Date().toISOString(),
    },
    by.id,
  );
  assert.equal(appt.status, "active");
  const revoked = await registry.revokeAppointment(appt.id, { reason: "Tenure ended early." }, by.id);
  assert.equal(revoked?.status, "revoked");
  assert.equal(revoked?.revokeReason, "Tenure ended early.");
  assert.equal(registry.listAppointments("active").length, 0);
});

test("announcements publish with window filtering", async () => {
  const draft = await registry.createAnnouncement(
    { title: "Draft notice", body: "This is a draft announcement body.", audience: "all", status: "draft" },
    by,
  );
  assert.equal(registry.publishedAnnouncements().length, 0);
  await registry.updateAnnouncement(draft.id, { ...draft, status: "published", publishAt: new Date(Date.now() - 1000).toISOString() });
  assert.equal(registry.publishedAnnouncements().length, 1);
  await registry.updateAnnouncement(draft.id, { ...draft, status: "published", expireAt: new Date(Date.now() - 1000).toISOString() });
  assert.equal(registry.publishedAnnouncements().length, 0);
  assert.equal(await registry.deleteAnnouncement(draft.id), 1);
});

test("requests triage and profiles manage visibility", async () => {
  const req = await registry.submitRequest(
    { category: "Welfare", subject: "Hostel water issue", body: "No water on the third floor since morning." },
    by,
  );
  assert.equal(req.status, "new");
  const triaged = await registry.triageRequest(req.id, { status: "resolved", assignee: "Welfare", resolution: "Fixed." });
  assert.equal(triaged?.status, "resolved");
  const profile = await registry.saveProfile({ name: "Test Officer", position: "PRO", active: true });
  assert.equal(registry.activeProfiles().length, 1);
  await registry.updateProfile(profile.id, { ...profile, active: false });
  assert.equal(registry.activeProfiles().length, 0);
  assert.equal(registry.listProfiles().length, 1);
});
