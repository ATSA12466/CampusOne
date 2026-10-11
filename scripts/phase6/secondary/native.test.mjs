import test from "node:test";
import assert from "node:assert/strict";
import {
  campusId,
  requestInputSchema,
  campusActivitySchema,
} from "../../../src/services/validation/campus-operations.schema.ts";
import { isAllowedPlaybackSrc } from "../../../src/config/media.ts";
import { entitySchemas } from "../../../src/services/validation/catalog.schemas.ts";
import { demoCatalog } from "../../../src/services/demo/catalog.service.ts";
import { demoAuthService } from "../../../src/services/auth/demo-auth.service.ts";

test("SRC requests bound normalized input and safe canonical references", () => {
  assert.equal(
    requestInputSchema.parse({
      title: "  Study room ",
      category: "Welfare",
      description: "  A useful private request description.  ",
    }).title,
    "Study room",
  );
  for (const id of ["../secret", "/x", "x?redirect", "x#y", "x\\y"])
    assert.equal(campusId.safeParse(id).success, false);
  assert.equal(
    requestInputSchema.safeParse({
      title: "x",
      category: "anything",
      description: "short",
    }).success,
    false,
  );
});
test("Private activity rejects duplicate, unbounded and malformed requests instead of false empty", () => {
  assert.equal(
    campusActivitySchema.safeParse({
      savedAnnouncementIds: ["a1", "a1"],
      requests: [],
    }).success,
    false,
  );
  assert.equal(
    campusActivitySchema.safeParse({
      savedAnnouncementIds: [],
      requests: [
        {
          id: "r",
          title: "Valid",
          description: "Enough description.",
          category: "Welfare",
          status: "accepted",
          createdAt: "2026-10-11",
        },
      ],
    }).success,
    false,
  );
});
test("Media playback permits local licensed paths, never schemes/traversal/unapproved origins", () => {
  for (const src of ["/media/demo/flower.webm", "/media/demo/t-rex-roar.mp3"])
    assert.equal(isAllowedPlaybackSrc(src), true);
  for (const src of [
    "javascript:alert(1)",
    "http://localhost:4000/media",
    "/media/../../private",
    "//example.com/video",
    "https://unapproved.invalid/x",
  ])
    assert.equal(isAllowedPlaybackSrc(src), false);
});
test("Announcements preserve original URLs while reaching twelve validated updates and real samples", async () => {
  const updates = await demoCatalog.list("announcements", { pageSize: 30 }),
    media = await demoCatalog.list("media", { pageSize: 30 });
  assert.equal(updates.total, 12);
  assert.equal(
    updates.items.find((r) => r.id === "a1").title,
    "SRC study space extension approved",
  );
  assert.equal(media.items.filter((r) => r.source).length, 2);
  for (const item of updates.items)
    assert.ok(entitySchemas.announcements.safeParse(item).success);
});
test("Campus local saves/requests persist idempotently without changing executive seeds; guests, storage and API guards", async (t) => {
  const saved = new Map();
  let denied = false;
  const storage = {
    getItem: (k) => saved.get(k) ?? null,
    setItem: (k, v) => {
      if (denied) throw new DOMException("Denied", "SecurityError");
      saved.set(k, v);
    },
    removeItem: (k) => saved.delete(k),
  };
  const previous = ["window", "localStorage"].map((k) => [
    k,
    Object.getOwnPropertyDescriptor(globalThis, k),
  ]);
  for (const k of ["window", "localStorage"])
    Object.defineProperty(globalThis, k, {
      configurable: true,
      value: k === "window" ? { localStorage: storage } : storage,
    });
  try {
    const { useAuthStore: auth } = await import(
        "../../../src/stores/auth-store.ts"
      ),
      { useAppStore: app } = await import("../../../src/stores/app-store.ts"),
      { createCampusActions } = await import(
        "../../../src/services/campus-operations/campus-actions.ts"
      ),
      initial = demoAuthService.initialUser(),
      service = createCampusActions("demo");
    auth.getState().setSession({ user: initial, source: "demo" });
    auth.getState().finishHydration();
    app.getState().resetDemo();
    await t.test(
      "Canonical saves and private SRC drafts rehydrate, role state stays intact",
      async () => {
        await service.saveAnnouncement("a1", true);
        await service.saveAnnouncement("a1", true);
        assert.equal(app.getState().bookmarks.length, 1);
        assert.equal(app.getState().memberships.length, 2);
        await service.submitRequest({
          title: "A quiet study room",
          category: "Academic support",
          description: "Please retain this valid private request.",
        });
        await app.persist.rehydrate();
        assert.ok(
          (await service.activity()).requests.some(
            (r) => r.title === "A quiet study room",
          ),
        );
      },
    );
    await t.test(
      "Denied durable storage is visit-only; missing resources/guest writes never succeed",
      async () => {
        denied = true;
        assert.equal(
          (await service.saveAnnouncement("a2", true)).persisted,
          false,
        );
        await assert.rejects(service.saveAnnouncement("missing", true));
        denied = false;
        auth.getState().signOut();
        await assert.rejects(
          service.submitRequest({
            title: "Valid request",
            category: "Welfare",
            description: "A valid request description.",
          }),
        );
      },
    );
    await t.test(
      "API methods exclude role/owner/status, private state never falls back to demo and accepted owner changes reject",
      async () => {
        auth.getState().setSession({ user: initial, source: "api" });
        const api = createCampusActions("api"),
          original = globalThis.fetch,
          calls = [];
        globalThis.fetch = async (url, init) => {
          calls.push({ url, init });
          return Response.json(
            String(url).endsWith("/campus/activity")
              ? { savedAnnouncementIds: [], requests: [] }
              : { ok: true },
          );
        };
        try {
          await api.activity();
          await api.saveAnnouncement("a1", true);
          await api.saveAnnouncement("a1", false);
          await api.submitRequest({
            title: "API draft",
            category: "Infrastructure",
            description: "The backend determines processing status.",
          });
          assert.deepEqual(
            calls.map((c) => c.init.method ?? "GET"),
            ["GET", "PUT", "DELETE", "POST"],
          );
          assert.equal(calls[1].init.body, undefined);
          assert.deepEqual(Object.keys(JSON.parse(calls[3].init.body)).sort(), [
            "category",
            "description",
            "title",
          ]);
          assert.equal(app.getState().bookmarks.length, 0);
          globalThis.fetch = async () => {
            auth
              .getState()
              .setSession({
                user: { ...initial, email: "other@example.test" },
                source: "api",
              });
            return Response.json({ ok: true });
          };
          await assert.rejects(
            api.saveAnnouncement("a1", true),
            /account changed/,
          );
        } finally {
          globalThis.fetch = original;
        }
      },
    );
  } finally {
    for (const [k, d] of previous) {
      if (d) Object.defineProperty(globalThis, k, d);
      else delete globalThis[k];
    }
  }
});
