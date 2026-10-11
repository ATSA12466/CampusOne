import assert from "node:assert/strict";
import test from "node:test";
import {
  storedAuth,
  storedProfile,
  storedOnboarding,
  sameAccount,
} from "../../src/lib/auth/profile.ts";
import { studentReturnPath } from "../../src/lib/auth/return-path.ts";
import { safeStorage, storageFailed } from "../../src/lib/auth/persistence.ts";
import { destinations } from "../../src/config/navigation.ts";
const user = {
  id: "local-1",
  name: "Ama Nyarko",
  email: "ama@campusone.demo",
  role: "student",
  programme: "BSc Information Technology",
  level: "Level 300",
};
test("stored profile is rebuilt from known fields; secrets, files and blob/data URLs never survive", () => {
  const parsed = storedProfile({
    ...user,
    password: "never-save-me",
    token: "not-a-token",
    file: { bytes: [1, 2] },
    avatar: "blob:https://campusone.invalid/a",
  });
  assert.deepEqual(parsed, user);
  assert.ok(!JSON.stringify(parsed).includes("never-save-me"));
  assert.deepEqual(storedProfile({ ...user, avatar: "data:image/png;base64,abcd" }), user);
  assert.deepEqual(storedProfile({ ...user, avatar: "https://unapproved.example/a.jpg" }), user);
});
test("corrupted persisted roles/profiles fail safely; legacy demo state derives role from profile", () => {
  for (const raw of [
    null,
    [],
    "wrong",
    { ...user, role: "constructor" },
    { ...user, name: "" },
    { ...user, email: 4 },
  ])
    assert.equal(storedProfile(raw), null);
  const parsed = storedAuth({ user, role: "administrator", unrelated: "ignored" });
  assert.equal(parsed.role, "student");
  assert.deepEqual(parsed.user, user);
  assert.equal(storedAuth({ user: null, role: "club-executive" }).role, "student");
});
test("API profiles/roles are not restored as authentication from local storage", () => {
  const parsed = storedAuth({
    user: { ...user, role: "administrator" },
    role: "administrator",
    source: "api",
  });
  assert.equal(parsed.user, null);
  assert.equal(parsed.role, "student");
  assert.equal(parsed.source, "api");
});
test("legacy onboarding completion migrates; progress/preferences are sanitized and bounded", () => {
  assert.equal(storedOnboarding({ completed: true }).completed, true);
  for (const step of [-1, 5, 1.5, NaN, "4"]) assert.equal(storedOnboarding({ step }).step, 0);
  assert.equal(storedOnboarding({ step: 4 }).step, 4);
  const parsed = storedOnboarding({
    preferences: {
      name: "A".repeat(81),
      programme: "Injected",
      level: 100,
      portrait: "blob:bad",
      interests: ["Clubs & societies", "bad", "Clubs & societies"],
      password: "ignore",
    },
  });
  assert.equal(parsed.preferences.name, "");
  assert.deepEqual(parsed.preferences.interests, ["Clubs & societies"]);
  assert.equal(parsed.preferences.portrait, "initials");
});
test("next destinations retain student URLs but reject external, malformed, encoded traversal and auth loops", () => {
  for (const { href } of destinations) assert.equal(studentReturnPath(href), href);
  for (const path of [
    "/clubs/club-1",
    "/events/e1",
    "/academics/resources/r1",
    "/accommodation/h1",
    "/marketplace/mk1",
  ])
    assert.equal(studentReturnPath(path), path);
  for (const path of [
    undefined,
    [],
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/sign-in",
    "/onboarding",
    "/api/auth",
    "/home?next=evil",
    "/clubs/%2e%2e",
    "/clubs/%252e%252e",
    "/clubs/%2f%2fevil",
    "/clubs/%GG",
    "/academics/other/r1",
    "/home/deep",
    "/events/e1/extra",
  ])
    assert.equal(studentReturnPath(path), "/home", String(path));
});
test("account comparison includes identity and normalized email, not only the demo role", () => {
  assert.equal(
    sameAccount(user, { ...user, role: "club-executive", email: user.email.toUpperCase() }),
    true,
  );
  assert.equal(sameAccount(null, user), false);
  assert.equal(sameAccount(user, { ...user, id: "other" }), false);
  assert.equal(sameAccount(user, { ...user, email: "other@demo.test" }), false);
});
test("private/unavailable device storage uses memory without throwing", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      get localStorage() {
        throw new Error("denied");
      },
    },
  });
  try {
    safeStorage.setItem("phase5-private-check", "temporary");
    assert.equal(safeStorage.getItem("phase5-private-check"), "temporary");
    assert.equal(storageFailed("phase5-private-check"), true);
    safeStorage.removeItem("phase5-private-check");
    assert.equal(safeStorage.getItem("phase5-private-check"), null);
  } finally {
    if (original) Object.defineProperty(globalThis, "window", original);
    else delete globalThis.window;
  }
});
