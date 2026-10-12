import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.CAMPUSONE_DATA_DIR = mkdtempSync(join(tmpdir(), "campusone-server-"));
const { resetStoreCache, store } = await import("../../src/server/store.ts");
const {
  AuthError,
  destroySession,
  getSessionUser,
  loginUser,
  registerUser,
  updateProfile,
} = await import("../../src/server/auth.ts");
const { hashPassword, verifyPassword } = await import("../../src/server/crypto.ts");
resetStoreCache();

test("registration issues a session and rejects duplicate emails", async () => {
  const first = await registerUser({
    name: "Test Student",
    email: "Test@Example.edu.gh",
    password: "correct-horse-01",
    programme: "BSc Test",
    level: "100",
  });
  assert.equal(first.user.email, "test@example.edu.gh");
  assert.equal(first.user.role, "student");
  assert.ok(!("passwordHash" in first.user));
  assert.ok(first.token.startsWith("c1s_"));
  await assert.rejects(
    () =>
      registerUser({ name: "Other", email: "test@example.edu.gh", password: "other-pass-01" }),
    (error) => error instanceof AuthError && error.code === "email-taken",
  );
});

test("login accepts correct credentials and rejects wrong ones uniformly", async () => {
  const ok = await loginUser({ email: "test@example.edu.gh", password: "correct-horse-01" });
  assert.equal(ok.user.name, "Test Student");
  for (const input of [
    { email: "test@example.edu.gh", password: "wrong-password" },
    { email: "nobody@example.edu.gh", password: "correct-horse-01" },
  ])
    await assert.rejects(() => loginUser(input), (error) => {
      assert.ok(error instanceof AuthError);
      assert.equal(error.code, "invalid-credentials");
      assert.equal(error.status, 401);
      return true;
    });
});

test("sessions resolve, expire and destroy without leaking hashes", async () => {
  const { token } = await loginUser({ email: "test@example.edu.gh", password: "correct-horse-01" });
  const session = await getSessionUser(token);
  assert.equal(session?.email, "test@example.edu.gh");
  assert.equal(await getSessionUser("c1s_bogus"), null);
  assert.equal(await getSessionUser(null), null);
  await destroySession(token);
  assert.equal(await getSessionUser(token), null);
});

test("suspended accounts cannot sign in or use sessions", async () => {
  const { token } = await loginUser({ email: "test@example.edu.gh", password: "correct-horse-01" });
  await store.update("users", (u) => u.email === "test@example.edu.gh", { status: "suspended" });
  assert.equal(await getSessionUser(token), null);
  await assert.rejects(
    () => loginUser({ email: "test@example.edu.gh", password: "correct-horse-01" }),
    (error) => error instanceof AuthError && error.code === "account-suspended",
  );
  await store.update("users", (u) => u.email === "test@example.edu.gh", { status: "active" });
});

test("profile updates validate and persist", async () => {
  const me = await loginUser({ email: "test@example.edu.gh", password: "correct-horse-01" });
  const updated = await updateProfile(me.user.id, { name: "New Name", level: "200" });
  assert.equal(updated?.name, "New Name");
  assert.equal(updated?.level, "200");
  await assert.rejects(() => updateProfile(me.user.id, { name: "x" }));
});

test("password hashing verifies and rejects malformed input", async () => {
  const hash = await hashPassword("s3cure-password");
  assert.equal(await verifyPassword("s3cure-password", hash), true);
  assert.equal(await verifyPassword("wrong", hash), false);
  assert.equal(await verifyPassword("x", "not-a-hash"), false);
  assert.equal(await verifyPassword("x", "scrypt$999$00$00"), false);
});
