import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.CAMPUSONE_DATA_DIR = mkdtempSync(join(tmpdir(), "campusone-campus-"));
const { resetStoreCache } = await import("../../src/server/store.ts");
const { campus } = await import("../../src/server/campus.ts");
resetStoreCache();

const member = { id: "u_member", name: "Member User" };

test("memberships request once, review once, and leave cleanly", async () => {
  const first = await campus.requestMembership("club-1", member, "Please let me join.");
  assert.equal(first.status, "pending");
  const again = await campus.requestMembership("club-1", member, "Again");
  assert.equal(again.id, first.id);
  const approved = await campus.reviewMembership(first.id, "approved", "u_exec");
  assert.equal(approved?.status, "approved");
  assert.equal(approved?.decidedBy, "u_exec");
  assert.equal(campus.listMemberships("club-1").length, 1);
  assert.equal(await campus.leaveClub("club-1", member.id), 1);
  assert.equal(campus.listMemberships("club-1").length, 0);
});

test("rsvps enforce capacity and stay idempotent", async () => {
  const event = { id: "evt-9", seats: 1, baseRegistered: 0 };
  const first = await campus.setRsvp(event, member, true);
  assert.equal(first.ok, true);
  assert.match(first.rsvp?.ticketRef ?? "", /^C1-/);
  const repeat = await campus.setRsvp(event, member, true);
  assert.equal(repeat.ok && repeat.rsvp?.id, first.ok && first.rsvp?.id);
  const full = await campus.setRsvp(event, { id: "u_other", name: "Other" }, true);
  assert.equal(full.ok, false);
  const cancel = await campus.setRsvp(event, member, false);
  assert.equal(cancel.ok, true);
  assert.equal(campus.getRsvp(event.id, member.id), null);
});

test("saves toggle per user, kind and entity", async () => {
  await campus.setSaved(member.id, "club", "club-1", true);
  await campus.setSaved(member.id, "club", "club-1", true);
  assert.deepEqual(campus.userSaves(member.id, "club"), ["club-1"]);
  assert.deepEqual(campus.userSaves(member.id, "event"), []);
  await campus.setSaved(member.id, "club", "club-1", false);
  assert.deepEqual(campus.userSaves(member.id, "club"), []);
});
