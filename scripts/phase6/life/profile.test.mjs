import assert from "node:assert/strict";
import test from "node:test";
import { useAuthStore } from "../../../src/stores/auth-store.ts";
import { profileActions } from "../../../src/services/profile/profile-actions.ts";
import { profileInputSchema } from "../../../src/services/validation/profile.schema.ts";
import { createWorkspaceService } from "../../../src/services/workspace/workspace-actions.ts";
import { workspaceSchemas } from "../../../src/services/validation/workspace.schema.ts";
const user = {
  id: "profile-tester",
  email: "profile@campusone.demo",
  name: "Profile tester",
  role: "student",
  programme: "Information Technology",
  level: "Level 300",
};
const prefs = {
  id: "profile",
  name: "Esi Owusu",
  programme: "Computer Engineering",
  level: "Level 200",
  bio: "A little more curiosity.",
  interests: "Robotics and music",
  visibility: "private",
  showProgramme: "no",
};
const records = new Map();
globalThis.localStorage = {
  getItem: (k) => records.get(k) ?? null,
  setItem: (k, v) => records.set(k, v),
  removeItem: (k) => records.delete(k),
};
const session = (source = "demo", u = user) =>
  useAuthStore.setState({
    user: u,
    source,
    role: u?.role ?? "student",
    hydrated: true,
  });
test("profile schema bounds personal fields and refuses role, email and unsafe/unbounded photos", () => {
  const { id, ...fields } = prefs;
  assert.equal(profileInputSchema.safeParse(fields).success, true);
  for (const bad of [
    { ...fields, name: "a" },
    { ...fields, bio: "a".repeat(501) },
    { ...fields, role: "administrator" },
    { ...fields, email: "changed@invalid.test" },
  ])
    assert.equal(profileInputSchema.safeParse(bad).success, false);
  assert.equal(
    workspaceSchemas.profile.safeParse({ ...prefs, id: "other" }).success,
    false,
  );
  assert.equal(
    workspaceSchemas.profile.safeParse({
      ...prefs,
      photo: "data:text/html;base64,eA==",
    }).success,
    false,
  );
});
test("profile edits persist private preferences, personalize demo fields but retain identity and authority", async () => {
  session();
  assert.equal((await profileActions.save(prefs)).persisted, true);
  assert.equal(useAuthStore.getState().user.name, prefs.name);
  assert.equal(useAuthStore.getState().user.email, user.email);
  assert.equal(useAuthStore.getState().user.role, "student");
  assert.equal(useAuthStore.getState().user.id, user.id);
  assert.deepEqual((await createWorkspaceService().list("profile"))[0], prefs);
});
test("profile owned-photo record replaces without duplicates; removal and owner isolation persist", async () => {
  session();
  const s = createWorkspaceService(),
    photo = { ...prefs, photo: "data:image/jpeg;base64,aGVsbG8=" };
  await s.put("profile", photo);
  await s.put("profile", photo);
  assert.equal((await s.list("profile")).length, 1);
  await s.put("profile", prefs);
  assert.equal((await s.list("profile"))[0].photo, undefined);
  session("demo", { ...user, email: "different@campusone.demo" });
  assert.deepEqual(await s.list("profile"), []);
  session();
});
test("guest and aborted profile writes fail without changing identity; denied storage reports visit-only", async () => {
  session("demo", null);
  await assert.rejects(profileActions.save(prefs), /Sign in/);
  session();
  const c = new AbortController();
  c.abort();
  await assert.rejects(
    profileActions.save(prefs, { signal: c.signal }),
    (e) => e.name === "AbortError",
  );
  const save = localStorage.setItem;
  localStorage.setItem = () => {
    throw new Error("Denied");
  };
  try {
    assert.equal((await profileActions.save(prefs)).persisted, false);
  } finally {
    localStorage.setItem = save;
  }
});
test("API profile workspace sends no role/email, is publisher-owned and does not fall back to local preferences", async () => {
  session("api");
  const original = fetch,
    hits = [];
  globalThis.fetch = async (url, o) => {
    hits.push({ url: String(url), ...o });
    return new Response(
      JSON.stringify(o.method === "PUT" ? { ok: true } : [prefs]),
      { status: 200 },
    );
  };
  try {
    const s = createWorkspaceService("api");
    await s.put("profile", prefs);
    assert.deepEqual(await s.list("profile"), [prefs]);
    assert.ok(
      !JSON.parse(hits[0].body).role && !JSON.parse(hits[0].body).email,
    );
    assert.ok(
      hits.every((h) => h.cache === "no-store" && h.credentials === "include"),
    );
    globalThis.fetch = async () => new Response("{}", { status: 503 });
    await assert.rejects(s.list("profile"));
  } finally {
    globalThis.fetch = original;
    session();
  }
});
