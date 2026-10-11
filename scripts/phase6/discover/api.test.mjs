import assert from "node:assert/strict";
import test from "node:test";
import { apiDiscoverActions } from "../../../src/services/discover/api-actions.service.ts";
import { ApiError } from "../../../src/services/api/client.ts";
import { withFetch } from "./native-helpers.mjs";
test("proposed Discover activity/save use same-origin port 4000, encoded IDs, no-store/cookies and desired-state verbs", async () => {
  const calls = [];
  await withFetch(
    async (url, options) => {
      calls.push({ url, options });
      return new Response(
        JSON.stringify(
          url.endsWith("/activity")
            ? { saved: [{ category: "events", id: "e1" }] }
            : { ok: true },
        ),
      );
    },
    async () => {
      assert.equal(
        (
          await apiDiscoverActions.activity({
            headers: { "X-Fixture": "test" },
          })
        ).saved[0].id,
        "e1",
      );
      await apiDiscoverActions.save(
        { category: "events", id: "event name?" },
        true,
      );
      await apiDiscoverActions.save(
        { category: "events", id: "event name?" },
        false,
      );
    },
  );
  assert.deepEqual(
    calls.map((c) => c.options.method ?? "GET"),
    ["GET", "PUT", "DELETE"],
  );
  assert.equal(calls[0].options.headers.get("X-Fixture"), "test");
  for (const c of calls) {
    assert.ok(c.url.startsWith("http://127.0.0.1:4000/api/discover/"));
    assert.equal(c.options.cache, "no-store");
    assert.equal(c.options.credentials, "include");
    assert.ok(c.options.signal instanceof AbortSignal);
    assert.equal(c.options.body, undefined);
  }
  assert.ok(calls[1].url.endsWith("/events/event%20name%3F/saved"));
});
test("API HTTP/network/malformed ack/activity errors stay failures without local fallback", async () => {
  for (const status of [401, 409, 500])
    await withFetch(
      async () => new Response("{}", { status }),
      async () =>
        assert.rejects(
          apiDiscoverActions.save({ category: "events", id: "e1" }, true),
          (e) => e instanceof ApiError && e.status === status,
        ),
    );
  for (const payload of [{ ok: false }, {}])
    await withFetch(
      async () => new Response(JSON.stringify(payload)),
      async () =>
        assert.rejects(
          apiDiscoverActions.save({ category: "events", id: "e1" }, true),
          (e) => e.code === "VALIDATION",
        ),
    );
  await withFetch(
    async () =>
      new Response(JSON.stringify({ saved: [{ category: "alien", id: "x" }] })),
    async () =>
      assert.rejects(
        apiDiscoverActions.activity(),
        (e) => e.code === "VALIDATION",
      ),
  );
  await withFetch(
    async () => {
      throw new TypeError("offline");
    },
    async () =>
      assert.rejects(
        apiDiscoverActions.activity(),
        (e) => e.code === "NETWORK",
      ),
  );
});
test("invalid paths fail before a write and caller abort is preserved through action bounds", async () => {
  let writes = 0;
  await withFetch(
    async (_url, options) => {
      writes++;
      options.signal.throwIfAborted();
      return new Response('{"ok":true}');
    },
    async () => {
      await assert.rejects(
        apiDiscoverActions.save({ category: "events", id: "../bad" }, true),
      );
      assert.equal(writes, 0);
      const c = new AbortController();
      c.abort();
      await assert.rejects(
        apiDiscoverActions.save({ category: "events", id: "e1" }, true, {
          signal: c.signal,
        }),
        (e) => e.name === "AbortError",
      );
    },
  );
});
