import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.CAMPUSONE_DATA_DIR = mkdtempSync(join(tmpdir(), "campusone-attendance-"));
const { resetStoreCache } = await import("../../src/server/store.ts");
const { registerUser } = await import("../../src/server/auth.ts");
const { attendance, mintSessionCode, AttendanceError } = await import(
  "../../src/server/attendance.ts"
);
const { myBadges, listBadgeDefinitions } = await import("../../src/server/badges.ts");
const { unreadCount } = await import("../../src/server/notify.ts");
const { campus } = await import("../../src/server/campus.ts");
resetStoreCache();

// All writes happen inside tests (sequential queue); nothing at module level.
const ctx = {};

function window(hoursAhead = 1) {
  const now = Date.now();
  return {
    startsAt: new Date(now - 600_000).toISOString(),
    endsAt: new Date(now + hoursAhead * 3_600_000).toISOString(),
  };
}

test("sessions validate windows and mint verifiable rotating codes", async () => {
  ctx.exec = await registerUser({ name: "Exec Officer", email: "exec@example.edu.gh", password: "exec-pass-01" });
  ctx.student = await registerUser({ name: "Stu Dent", email: "stu@example.edu.gh", password: "stu-pass-01" });
  ctx.other = await registerUser({ name: "Other One", email: "other@example.edu.gh", password: "other-pass-01" });
  ctx.session = await attendance.createSession(
    { eventId: "evt-1", eventTitle: "Tech Talk Night", ...window() },
    ctx.exec.user.id,
  );
  assert.equal(ctx.session.status, "active");
  const live = await mintSessionCode(ctx.session.id);
  assert.match(live.code, /^C1A1\.att_[0-9a-f]+\.\d+\.[0-9a-f]{64}$/);
  assert.ok(!live.code.includes("Tech Talk"));
  await assert.rejects(
    () =>
      attendance.createSession(
        { eventId: "e", eventTitle: "Bad", startsAt: window().endsAt, endsAt: window().startsAt },
        ctx.exec.user.id,
      ),
    AttendanceError,
  );
});

test("check-in records attendance once and awards the first badge", async () => {
  const { code } = await mintSessionCode(ctx.session.id);
  const first = await attendance.checkIn(code, { id: ctx.student.user.id, name: ctx.student.user.name });
  assert.equal(first.duplicate, false);
  assert.equal(first.record.status, "present");
  assert.equal(first.record.method, "qr");
  assert.equal(first.badges.length, 1);
  assert.equal(first.badges[0].badge.id, "badge-first-steps");
  const again = await attendance.checkIn(code, { id: ctx.student.user.id, name: ctx.student.user.name });
  assert.equal(again.duplicate, true);
  assert.equal(again.record.id, first.record.id);
  assert.equal(again.badges.length, 0);
  assert.equal(myBadges(ctx.student.user.id).length, 1);
  assert.ok(unreadCount(ctx.student.user.id) >= 2);
});

test("tampered, expired and out-of-window codes are rejected", async () => {
  const { code } = await mintSessionCode(ctx.session.id);
  const tampered = `${code.slice(0, -1)}${code.endsWith("0") ? "1" : "0"}`;
  await assert.rejects(() => attendance.checkIn(tampered, { id: ctx.other.user.id, name: "x" }), /not valid/);
  await assert.rejects(() => attendance.checkIn("bogus", { id: ctx.other.user.id, name: "x" }), /not valid/);
  const stale = await mintSessionCode(ctx.session.id, new Date(Date.now() - 10 * 60_000));
  await assert.rejects(
    () => attendance.checkIn(stale.code, { id: ctx.other.user.id, name: "x" }),
    /expired/,
  );
  const future = await attendance.createSession(
    {
      eventId: "evt-2",
      eventTitle: "Later Event",
      startsAt: new Date(Date.now() + 3_600_000).toISOString(),
      endsAt: new Date(Date.now() + 7_200_000).toISOString(),
    },
    ctx.exec.user.id,
  );
  const futureCode = await mintSessionCode(future.id);
  await assert.rejects(
    () => attendance.checkIn(futureCode.code, { id: ctx.other.user.id, name: "x" }),
    /not opened/,
  );
});

test("revoked sessions kill live codes; capacity is enforced", async () => {
  const capped = await attendance.createSession(
    { eventId: "evt-3", eventTitle: "Small Room", maxCheckins: 1, ...window() },
    ctx.exec.user.id,
  );
  const { code } = await mintSessionCode(capped.id);
  await attendance.checkIn(code, { id: ctx.student.user.id, name: ctx.student.user.name });
  await assert.rejects(
    () => attendance.checkIn(code, { id: ctx.other.user.id, name: ctx.other.user.name }),
    /capacity/,
  );
  await attendance.setSessionStatus(capped.id, "revoked");
  await assert.rejects(() => mintSessionCode(capped.id), /revoked/);
  await assert.rejects(
    () => attendance.checkIn(code, { id: ctx.exec.user.id, name: ctx.exec.user.name }),
    /revoked/,
  );
});

test("membership-gated sessions reject outsiders", async () => {
  const gated = await attendance.createSession(
    {
      eventId: "evt-4",
      eventTitle: "Members Only",
      clubId: "club-tech-1",
      clubName: "Tech Club",
      requireMembership: true,
      ...window(),
    },
    ctx.exec.user.id,
  );
  const { code } = await mintSessionCode(gated.id);
  await assert.rejects(
    () => attendance.checkIn(code, { id: ctx.other.user.id, name: ctx.other.user.name }),
    /approved club members/,
  );
  const req = await campus.requestMembership(
    "club-tech-1",
    { id: ctx.other.user.id, name: ctx.other.user.name },
    "",
  );
  await campus.reviewMembership(req.id, "approved", ctx.exec.user.id);
  const ok = await attendance.checkIn(code, { id: ctx.other.user.id, name: ctx.other.user.name });
  assert.equal(ok.duplicate, false);
});

test("corrections keep history and explorer badge needs five events", async () => {
  const mine = attendance.myRecords(ctx.student.user.id);
  assert.ok(mine.length >= 2);
  const corrected = await attendance.correctRecord(
    mine[0].id,
    { status: "excused", reason: "Late arrival verified by exec." },
    ctx.exec.user.id,
  );
  assert.equal(corrected?.status, "excused");
  assert.equal(corrected?.correctedBy, ctx.exec.user.id);
  assert.match(corrected?.correctionReason ?? "", /Late arrival/);
  for (let i = 5; i <= 8; i++) {
    const s = await attendance.createSession(
      { eventId: `evt-${i}`, eventTitle: `Event ${i}`, ...window() },
      ctx.exec.user.id,
    );
    const { code } = await mintSessionCode(s.id);
    await attendance.checkIn(code, { id: ctx.other.user.id, name: ctx.other.user.name });
  }
  const badges = myBadges(ctx.other.user.id).map((b) => b.badgeId);
  assert.ok(badges.includes("badge-first-steps"));
  assert.ok(badges.includes("badge-explorer"));
  assert.equal(listBadgeDefinitions().length, 3);
});
