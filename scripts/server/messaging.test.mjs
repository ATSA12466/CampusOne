import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.CAMPUSONE_DATA_DIR = mkdtempSync(join(tmpdir(), "campusone-messaging-"));
const { resetStoreCache } = await import("../../src/server/store.ts");
const { registerUser } = await import("../../src/server/auth.ts");
const { messages, MessageError } = await import("../../src/server/messages.ts");
const { devices } = await import("../../src/server/devices.ts");
const { unreadCount } = await import("../../src/server/notify.ts");
const { campus } = await import("../../src/server/campus.ts");
resetStoreCache();

// All writes happen inside tests (sequential queue); nothing at module level.
const ctx = {};

test("direct conversations are unique per pair and private", async () => {
  ctx.amy = await registerUser({ name: "Amy Mensah", email: "amy@example.edu.gh", password: "amy-pass-01" });
  ctx.ben = await registerUser({ name: "Ben Owusu", email: "ben@example.edu.gh", password: "ben-pass-01" });
  ctx.cat = await registerUser({ name: "Cat Adu", email: "cat@example.edu.gh", password: "cat-pass-01" });
  const first = await messages.findOrCreateDirect(
    { id: ctx.amy.user.id, name: ctx.amy.user.name },
    ctx.ben.user.id,
  );
  const second = await messages.findOrCreateDirect(
    { id: ctx.ben.user.id, name: ctx.ben.user.name },
    ctx.amy.user.id,
  );
  assert.equal(first.id, second.id);
  await messages.postMessage(first.id, { id: ctx.amy.user.id, name: ctx.amy.user.name }, "Hello Ben");
  const thread = await messages.listMessages(first.id, ctx.ben.user.id);
  assert.equal(thread.length, 1);
  assert.equal(thread[0].body, "Hello Ben");
  await assert.rejects(() => messages.listMessages(first.id, ctx.cat.user.id), MessageError);
  await assert.rejects(
    () => messages.postMessage(first.id, { id: ctx.cat.user.id, name: ctx.cat.user.name }, "hi"),
    /access/,
  );
});

test("read markers drive unread counts and notifications fan out", async () => {
  const group = await messages.createGroup(
    { id: ctx.amy.user.id, name: ctx.amy.user.name },
    { title: "Study Group", memberIds: [ctx.ben.user.id, ctx.cat.user.id] },
  );
  await messages.postMessage(group.id, { id: ctx.ben.user.id, name: ctx.ben.user.name }, "Meeting at 5?");
  const amyList = messages.listConversations(ctx.amy.user.id);
  const row = amyList.find((c) => c.id === group.id);
  assert.equal(row?.unread, 1);
  assert.ok((unreadCount(ctx.cat.user.id) ?? 0) >= 1);
  await messages.markRead(group.id, ctx.amy.user.id);
  assert.equal(messages.listConversations(ctx.amy.user.id).find((c) => c.id === group.id)?.unread, 0);
});

test("club channels are membership-gated", async () => {
  const channel = await messages.createClubChannel(
    { id: ctx.amy.user.id, name: ctx.amy.user.name },
    { clubId: "club-tech-1", title: "Tech Club" },
  );
  assert.equal(channel.kind, "club");
  await assert.rejects(() => messages.listMessages(channel.id, ctx.ben.user.id), /access/);
  const req = await campus.requestMembership(
    "club-tech-1",
    { id: ctx.ben.user.id, name: ctx.ben.user.name },
    "",
  );
  await campus.reviewMembership(req.id, "approved", ctx.amy.user.id);
  await messages.postMessage(channel.id, { id: ctx.ben.user.id, name: ctx.ben.user.name }, "Go team");
  assert.equal((await messages.listMessages(channel.id, ctx.ben.user.id)).length, 1);
  const again = await messages.createClubChannel(
    { id: ctx.amy.user.id, name: ctx.amy.user.name },
    { clubId: "club-tech-1", title: "Tech Club" },
  );
  assert.equal(again.id, channel.id);
});

test("devices register idempotently per token", async () => {
  const first = await devices.register(ctx.amy.user.id, {
    platform: "android",
    token: "fcm-token-1234567890",
    appVersion: "1.0.0",
  });
  const second = await devices.register(ctx.amy.user.id, {
    platform: "android",
    token: "fcm-token-1234567890",
    appVersion: "1.0.1",
  });
  assert.equal(first.id, second.id);
  assert.equal(second.appVersion, "1.0.1");
  assert.equal(devices.listMine(ctx.amy.user.id).length, 1);
  await devices.revoke(ctx.amy.user.id, first.id);
  assert.equal(devices.listMine(ctx.amy.user.id).length, 0);
});
