import assert from "node:assert/strict";
import test from "node:test";
import { apiClubActions } from "../../../src/services/clubs/api-actions.service.ts";
import { ApiError } from "../../../src/services/api/client.ts";
async function withFetch(mock, run) {
  const original = globalThis.fetch;
  globalThis.fetch = mock;
  try {
    await run();
  } finally {
    globalThis.fetch = original;
  }
}
test("proposed API activity/mutations use port 4000, encoded IDs, credentials/no-store and no client identity/role", async () => {
  const calls = [];
  await withFetch(
    async (url, options) => {
      calls.push({ url, options });
      return new Response(
        JSON.stringify(
          url.endsWith("/activity") ? { memberships: [], savedIds: [] } : { ok: true },
        ),
      );
    },
    async () => {
      await apiClubActions.activity({ headers: { "X-Test": "fixture" } });
      await apiClubActions.request("club/a b", " Hello Ghana ");
      await apiClubActions.withdraw("club/a b");
      await apiClubActions.review("m/a", "approved");
      await apiClubActions.save("club/a b", true);
      await apiClubActions.save("club/a b", false);
    },
  );
  assert.equal(calls.length, 6);
  assert.deepEqual(
    calls.map((c) => c.options.method ?? "GET"),
    ["GET", "POST", "DELETE", "PATCH", "PUT", "DELETE"],
  );
  for (const { url, options } of calls) {
    assert.ok(url.startsWith("http://127.0.0.1:4000/api/clubs/"));
    assert.equal(options.cache, "no-store");
    assert.equal(options.credentials, "include");
    assert.ok(options.signal);
    if (options.body) {
      const body = JSON.parse(options.body);
      assert.ok(!("role" in body));
      assert.ok(!("userId" in body));
      assert.ok(!("acknowledged" in body));
    }
  }
  assert.match(calls[1].url, /club%2Fa%20b\/membership$/);
  assert.equal(JSON.parse(calls[1].options.body).note, "Hello Ghana");
  assert.match(calls[3].url, /m%2Fa$/);
});
test("API rejects HTTP/network/schema failures instead of substituting local demo success", async () => {
  for (const response of [
    new Response("{}", { status: 503 }),
    new Response('{"ok":false}'),
    new Response('{"memberships":[],"savedIds":[1]}'),
  ])
    await withFetch(
      async () => response,
      async () =>
        assert.rejects(
          response.status === 503
            ? apiClubActions.request("club-1", "")
            : apiClubActions.activity(),
          (error) => error instanceof ApiError,
        ),
    );
  await withFetch(
    async () => {
      throw new Error("offline");
    },
    async () =>
      assert.rejects(
        apiClubActions.save("club-1", true),
        (error) => error instanceof ApiError && error.code === "NETWORK",
      ),
  );
});
test("bad introduction fails before any network write; mutation ack must be exactly ok true", async () => {
  let calls = 0;
  await withFetch(
    async () => {
      calls++;
      return new Response('{"ok":false}');
    },
    async () => {
      await assert.rejects(apiClubActions.request("club-1", "x".repeat(401)));
      assert.equal(calls, 0);
      await assert.rejects(
        apiClubActions.withdraw("club-1"),
        (error) => error instanceof ApiError && error.code === "VALIDATION",
      );
    },
  );
});
test("caller abort is preserved through bounded API signals without a fake save", async () => {
  const controller = new AbortController();
  controller.abort();
  await withFetch(
    async (_url, options) => {
      options.signal.throwIfAborted();
    },
    async () =>
      assert.rejects(apiClubActions.save("club-1", true, { signal: controller.signal }), {
        name: "AbortError",
      }),
  );
});
