import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.CAMPUSONE_DATA_DIR = mkdtempSync(join(tmpdir(), "campusone-perms-"));
const { resetStoreCache, store } = await import("../../src/server/store.ts");
const {
  can,
  effectivePermissions,
  permissions,
  rolePermissions,
  toLegacyRole,
} = await import("../../src/server/permissions.ts");
const { registerUser } = await import("../../src/server/auth.ts");
resetStoreCache();

function as(user, roles, status = "active") {
  return { ...user, roles, status };
}

test("role defaults grant the documented baselines", () => {
  assert.deepEqual(rolePermissions.student, []);
  assert.ok(rolePermissions["src-admin"].includes("src.appointments.review"));
  assert.ok(!rolePermissions["src-admin"].includes("platform.branding.manage"));
  assert.deepEqual([...rolePermissions["super-admin"]].sort(), [...permissions].sort());
});

test("super-admin passes every check; students pass none", async () => {
  const { user } = await registerUser({
    name: "Root Admin",
    email: "root@example.edu.gh",
    password: "root-password-01",
  });
  const full = store.find("users", (u) => u.id === user.id);
  assert.ok(can(as(full, ["super-admin"]), "platform.branding.manage"));
  assert.ok(can(as(full, ["super-admin"]), "club.events.manage", { type: "club", id: "x" }));
  assert.equal(can(as(full, ["student"]), "platform.branding.manage"), false);
  assert.equal(effectivePermissions(as(full, ["student"])).length, 0);
});

test("scoped club grants stay inside their club", async () => {
  const { user } = await registerUser({
    name: "Club Exec",
    email: "exec@example.edu.gh",
    password: "exec-password-01",
  });
  const exec = store.find("users", (u) => u.id === user.id);
  await store.insert("grants", {
    id: "g1",
    userId: exec.id,
    permission: "club.members.manage",
    scopeType: "club",
    scopeId: "club-a",
    grantedBy: null,
    createdAt: new Date().toISOString(),
    expiresAt: null,
    revokedAt: null,
  });
  assert.equal(can(exec, "club.members.manage", { type: "club", id: "club-a" }), true);
  assert.equal(can(exec, "club.members.manage", { type: "club", id: "club-b" }), false);
  assert.equal(can(exec, "club.members.manage"), false);
  assert.equal(can(exec, "club.events.manage", { type: "club", id: "club-a" }), false);
});

test("revoked and expired grants are denied", async () => {
  const { user } = await registerUser({
    name: "Old Exec",
    email: "old@example.edu.gh",
    password: "old-password-01",
  });
  const old = store.find("users", (u) => u.id === user.id);
  const now = new Date().toISOString();
  await store.insert("grants", {
    id: "g-revoked",
    userId: old.id,
    permission: "club.members.manage",
    scopeType: "club",
    scopeId: "club-a",
    grantedBy: null,
    createdAt: now,
    expiresAt: null,
    revokedAt: now,
  });
  await store.insert("grants", {
    id: "g-expired",
    userId: old.id,
    permission: "club.events.manage",
    scopeType: "club",
    scopeId: "club-a",
    grantedBy: null,
    createdAt: now,
    expiresAt: new Date(Date.now() - 1000).toISOString(),
    revokedAt: null,
  });
  assert.equal(can(old, "club.members.manage", { type: "club", id: "club-a" }), false);
  assert.equal(can(old, "club.events.manage", { type: "club", id: "club-a" }), false);
});

test("suspended users lose all access and legacy mapping ranks roles", async () => {
  const { user } = await registerUser({
    name: "Bad Actor",
    email: "bad@example.edu.gh",
    password: "bad-password-01",
  });
  const bad = store.find("users", (u) => u.id === user.id);
  assert.equal(can(as(bad, ["super-admin"], "suspended"), "platform.users.manage"), false);
  assert.equal(toLegacyRole(["student", "club-president"]), "club-executive");
  assert.equal(toLegacyRole(["student", "src-executive"]), "src-representative");
  assert.equal(toLegacyRole(["student", "super-admin"]), "administrator");
});

test("rate limiter allows a burst then recovers after the window", async () => {
  const { rateLimit, resetRateLimits } = await import("../../src/server/rate-limit.ts");
  resetRateLimits();
  assert.equal(rateLimit("k", 2, 1000).allowed, true);
  assert.equal(rateLimit("k", 2, 1000).allowed, true);
  const denied = rateLimit("k", 2, 1000);
  assert.equal(denied.allowed, false);
  assert.ok(denied.retryAfterSec > 0);
  assert.equal(rateLimit("k", 2, 61_001).allowed, true);
});
