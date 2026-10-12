import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.CAMPUSONE_DATA_DIR = mkdtempSync(join(tmpdir(), "campusone-mobile-auth-"));
const { resetStoreCache, store } = await import("../../src/server/store.ts");
const {
  registerUser,
  issueMobileToken,
  getSessionUser,
  destroySession,
  parseBearerToken,
  AuthError,
} = await import("../../src/server/auth.ts");
resetStoreCache();

test("bearer header parsing accepts only well-formed tokens", () => {
  assert.equal(parseBearerToken("Bearer abc123"), "abc123");
  assert.equal(parseBearerToken("bearer c1s_deadbeef"), "c1s_deadbeef");
  assert.equal(parseBearerToken("  Bearer   xyz  "), "xyz");
  assert.equal(parseBearerToken(null), null);
  assert.equal(parseBearerToken(""), null);
  assert.equal(parseBearerToken("Basic abc"), null);
  assert.equal(parseBearerToken("Bearer"), null);
  assert.equal(parseBearerToken("Bearer a b"), null);
  assert.equal(parseBearerToken(`Bearer ${"x".repeat(201)}`), null);
});

test("mobile tokens share the session table and revoke cleanly", async () => {
  await registerUser({ name: "Mobile User", email: "mobile@example.edu.gh", password: "mobile-01" });
  const issued = await issueMobileToken({
    email: "mobile@example.edu.gh",
    password: "mobile-01",
    deviceName: "Pixel 8",
  });
  assert.match(issued.token, /^c1s_[0-9a-f]{64}$/);
  assert.equal(issued.user.email, "mobile@example.edu.gh");
  assert.ok(Date.parse(issued.expiresAt) > Date.now());
  const viaLookup = await getSessionUser(issued.token);
  assert.equal(viaLookup?.email, "mobile@example.edu.gh");
  const sessions = store.all("sessions");
  assert.equal(sessions.length, 2);
  assert.equal(sessions.find((s) => s.deviceName === "Pixel 8")?.client, "mobile");
  await destroySession(issued.token);
  assert.equal(await getSessionUser(issued.token), null);
  await assert.rejects(
    () => issueMobileToken({ email: "mobile@example.edu.gh", password: "wrong-pass", deviceName: "" }),
    AuthError,
  );
});
