import assert from "node:assert/strict";
import test from "node:test";
import { demoAuthActions } from "../../src/services/auth/demo-actions.service.ts";
import { demoAuthService } from "../../src/services/auth/demo-auth.service.ts";
import { apiAuthActions } from "../../src/services/auth/api-auth.service.ts";
import { createAuthPreview } from "../../src/services/demo/auth-preview.service.ts";
import { onboardingService } from "../../src/services/profile/onboarding.service.ts";
import { ApiError } from "../../src/services/api/client.ts";
const input = {
  email: "KWAME@CAMPUSONE.DEMO",
  password: "preview-password",
  role: "club-executive",
};
const user = demoAuthService.initialUser();
test("demo sign-in preserves submitted email/role without claiming credentials were verified", async () => {
  const session = await demoAuthActions.signIn(input);
  assert.equal(session.source, "demo");
  assert.equal(session.user.email, input.email.toLowerCase());
  assert.equal(session.user.role, "club-executive");
  assert.ok(!JSON.stringify(session).includes(input.password));
});
test("demo registration actually uses name/email, creates a local student profile and no password field", async () => {
  const session = await demoAuthActions.register({
    name: " Kwame Mensah ",
    email: input.email,
    password: input.password,
  });
  assert.equal(session.user.name, "Kwame Mensah");
  assert.equal(session.user.email, input.email.toLowerCase());
  assert.equal(session.user.role, "student");
  assert.ok(session.user.id.startsWith("local-"));
  assert.equal(session.user.programme, "Not selected");
  assert.equal(session.user.avatar, undefined);
  assert.ok(!JSON.stringify(session).includes(input.password));
});
test("demo recovery is a preview only; canceled requests reject without a fabricated success", async () => {
  assert.deepEqual(await demoAuthActions.requestReset(input.email), { delivery: "preview" });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(demoAuthActions.signIn(input, { signal: controller.signal }), {
    name: "AbortError",
  });
  await assert.rejects(
    demoAuthActions.register({ ...input, name: "Kwame" }, { signal: controller.signal }),
    { name: "AbortError" },
  );
});
test("development failures recover on resubmit; slow fixtures honor in-flight cancellation", async () => {
  const preview = createAuthPreview(demoAuthActions, "error");
  await assert.rejects(preview.signIn(input), /Controlled demo preview failure/);
  assert.equal((await preview.signIn(input)).source, "demo");
  const controller = new AbortController(),
    pending = createAuthPreview(demoAuthActions, "slow").register(
      { ...input, name: "Kwame" },
      { signal: controller.signal },
    );
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
});
test("local personalization clones its input, preserves an executive role and never changes a university record", () => {
  const original = { ...user, role: "club-executive" },
    before = structuredClone(original);
  const preferences = {
    name: "Kojo Mensah",
    programme: "BSc Computer Science",
    level: "Level 200",
    interests: [],
    portrait: "kojo",
  };
  const updated = onboardingService.personalizeDemo(original, preferences);
  assert.deepEqual(original, before);
  assert.equal(updated.role, "club-executive");
  assert.equal(updated.name, preferences.name);
  assert.equal(updated.level, "Level 200");
  assert.ok(updated.avatar.endsWith("student-kojo.webp"));
});
async function withFetch(mock, run) {
  const before = globalThis.fetch;
  globalThis.fetch = mock;
  try {
    await run();
  } finally {
    globalThis.fetch = before;
  }
}
test("API credentials use port 4000 on SSR, credentials/no-store, and omit client roles and consent/confirmation", async () => {
  const calls = [];
  await withFetch(
    async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ user }), { status: 200 });
    },
    async () => {
      assert.equal((await apiAuthActions.signIn(input)).source, "api");
      await apiAuthActions.register({
        name: "Kwame",
        ...input,
        confirmPassword: "not-forwarded",
        consent: true,
      });
    },
  );
  for (const { url, options } of calls) {
    assert.ok(url.startsWith("http://127.0.0.1:4000/api/auth/"));
    assert.equal(options.credentials, "include");
    assert.equal(options.cache, "no-store");
    assert.equal(options.method, "POST");
    const body = JSON.parse(options.body);
    assert.ok(!("role" in body));
    assert.ok(!("consent" in body));
    assert.ok(!("confirmPassword" in body));
  }
});
test("API session is backend-derived, 401 means signed-out, and invalid role/schema never substitutes a demo", async () => {
  await withFetch(
    async () => new Response(JSON.stringify({ user }), { status: 200 }),
    async () => assert.equal((await apiAuthActions.session()).user.name, user.name),
  );
  await withFetch(
    async () => new Response("{}", { status: 401 }),
    async () => assert.equal(await apiAuthActions.session(), null),
  );
  await withFetch(
    async () => new Response(JSON.stringify({ user: { ...user, role: "superuser" } })),
    async () =>
      await assert.rejects(
        apiAuthActions.signIn(input),
        (error) => error instanceof ApiError && error.code === "VALIDATION",
      ),
  );
});
test("API reset distinguishes request acceptance from mailbox delivery and logout accepts 204", async () => {
  await withFetch(
    async (url) =>
      url.endsWith("password-reset")
        ? new Response('{"accepted":true}', { status: 202 })
        : new Response(null, { status: 204 }),
    async () => {
      assert.deepEqual(await apiAuthActions.requestReset(input.email), { delivery: "requested" });
      await apiAuthActions.signOut();
    },
  );
});
test("API offline and HTTP errors remain errors, not local-demo authentication", async () => {
  await withFetch(
    async () => {
      throw new Error("unavailable");
    },
    async () =>
      await assert.rejects(
        apiAuthActions.signIn(input),
        (error) => error instanceof ApiError && error.code === "NETWORK",
      ),
  );
  await withFetch(
    async () => new Response("{}", { status: 503 }),
    async () =>
      await assert.rejects(
        apiAuthActions.register({ ...input, name: "Kwame" }),
        (error) => error instanceof ApiError && error.status === 503,
      ),
  );
});
