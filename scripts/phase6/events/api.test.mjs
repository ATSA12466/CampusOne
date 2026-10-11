import assert from "node:assert/strict";
import test from "node:test";
import { apiEventActions } from "../../../src/services/events/api-actions.service.ts";
import { eventCatalogService } from "../../../src/services/events/catalog.service.ts";
import { campusService } from "../../../src/services/index.ts";
import { ApiError } from "../../../src/services/api/client.ts";
import { withFetch } from "./native-helpers.mjs";
test("API event actions use the same-origin port-4000 adapter, encoded IDs, cookies/no-store and idempotent verbs", async () => {
  const calls = [];
  await withFetch(
    async (url, options) => {
      calls.push({ url, options });
      return new Response(
        JSON.stringify(
          url.endsWith("/activity")
            ? { goingIds: [], savedIds: [] }
            : url.endsWith("/ticket")
              ? {
                  eventId: "e/a b",
                  reference: "publisher",
                  payload: "publisher-token-123",
                  status: "valid",
                }
              : { ok: true },
        ),
      );
    },
    async () => {
      await apiEventActions.activity({ headers: { "X-Test": "fixture" } });
      await apiEventActions.rsvp("e/a b", true);
      await apiEventActions.rsvp("e/a b", false);
      await apiEventActions.save("e/a b", true);
      await apiEventActions.save("e/a b", false);
      const ticket = await apiEventActions.ticket("e/a b");
      assert.equal(ticket.source, "api");
      assert.equal(ticket.payload, "publisher-token-123");
    },
  );
  assert.deepEqual(
    calls.map((c) => c.options.method ?? "GET"),
    ["GET", "PUT", "DELETE", "PUT", "DELETE", "GET"],
  );
  for (const { url, options } of calls) {
    assert.ok(url.startsWith("http://127.0.0.1:4000/api/events/"));
    assert.equal(options.cache, "no-store");
    assert.equal(options.credentials, "include");
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.body, undefined);
    assert.ok(!JSON.stringify(options).includes("user-1"));
  }
  assert.ok(calls[1].url.includes("e%2Fa%20b"));
  assert.equal(calls[0].options.headers.get("X-Test"), "fixture");
});
test("HTTP failures, malformed activity and wrong-event tickets fail without any fabricated demo result", async () => {
  for (const status of [401, 409, 500])
    await withFetch(
      async () => new Response("{}", { status }),
      async () =>
        assert.rejects(
          apiEventActions.rsvp("e1", true),
          (e) => e instanceof ApiError && e.status === status,
        ),
    );
  await withFetch(
    async () =>
      new Response(
        JSON.stringify({
          goingIds: [],
          savedIds: [],
          attendance: [{ eventId: "e1", registered: -1 }],
        }),
      ),
    async () =>
      assert.rejects(
        apiEventActions.activity(),
        (e) => e instanceof ApiError && e.code === "VALIDATION",
      ),
  );
  await withFetch(
    async () =>
      new Response(
        JSON.stringify({
          eventId: "e2",
          reference: "bad",
          payload: "publisher-token",
          status: "valid",
        }),
      ),
    async () => assert.rejects(apiEventActions.ticket("e1"), /another event/),
  );
  await withFetch(
    async () => new Response(JSON.stringify({ ok: false })),
    async () =>
      assert.rejects(
        apiEventActions.save("e1", true),
        (e) => e instanceof ApiError && e.code === "VALIDATION",
      ),
  );
});
test("signals propagate into read/write adapters and cancellation never becomes success", async () => {
  const controller = new AbortController();
  controller.abort();
  await withFetch(
    async (_url, init) => {
      assert.equal(init.signal.aborted, true);
      throw new DOMException("Aborted", "AbortError");
    },
    async () => {
      await assert.rejects(apiEventActions.rsvp("e1", true, { signal: controller.signal }), {
        name: "AbortError",
      });
      await assert.rejects(apiEventActions.ticket("e1", { signal: controller.signal }), {
        name: "AbortError",
      });
    },
  );
  await assert.rejects(eventCatalogService.list(1, { signal: controller.signal }), {
    name: "AbortError",
  });
});
test("catalog read errors remain errors, get throws, oversized pages are rejected and deadlines are bounded", async () => {
  const original = campusService.list,
    originalGet = campusService.get;
  try {
    campusService.list = async (_collection, query) => {
      assert.equal(query.pageSize, 30);
      assert.ok(query.signal instanceof AbortSignal);
      throw new Error("Fixture backend unavailable");
    };
    const result = await eventCatalogService.list();
    assert.equal(result.page, null);
    assert.match(result.error, /backend unavailable/);
    assert.ok(Number.isFinite(Date.parse(result.now)));
    campusService.get = async () => {
      throw new Error("No event backend");
    };
    await assert.rejects(eventCatalogService.get("e1"), /No event backend/);
    campusService.list = async () => ({
      items: Array(31).fill({ id: "e1" }),
      page: 1,
      pageSize: 30,
      total: 31,
      hasMore: false,
    });
    assert.match((await eventCatalogService.list()).error, /too many records/);
  } finally {
    campusService.list = original;
    campusService.get = originalGet;
  }
});
