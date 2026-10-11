import assert from "node:assert/strict";
import test from "node:test";
import { demoEventActions } from "../../../src/services/events/demo-actions.service.ts";
import { eventCatalogService } from "../../../src/services/events/catalog.service.ts";
import { demoAuthService } from "../../../src/services/auth/demo-auth.service.ts";
test("local RSVP/save/ticket persistence, privacy, idempotence, storage failure and owner races", async (t) => {
  const saved = new Map();
  let denied = false;
  const storage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => {
      if (denied) throw new DOMException("Device storage blocked", "SecurityError");
      saved.set(key, value);
    },
    removeItem: (key) => saved.delete(key),
  };
  const originals = ["window", "localStorage"].map((key) => [
    key,
    Object.getOwnPropertyDescriptor(globalThis, key),
  ]);
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage },
  });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-11T12:00:00Z") });
  try {
    const { useAuthStore: auth } = await import("../../../src/stores/auth-store.ts"),
      { useAppStore: app } = await import("../../../src/stores/app-store.ts"),
      initial = demoAuthService.initialUser(),
      reset = () => {
        denied = false;
        auth.getState().setSession({ user: initial, source: "demo" });
        app.getState().resetDemo();
      };
    await t.test(
      "explicit RSVP/remove is idempotent, preserves club seeds and survives hydration",
      async () => {
        reset();
        await demoEventActions.rsvp("e1", true);
        await demoEventActions.rsvp("e1", true);
        assert.deepEqual(app.getState().registrations, ["e1"]);
        assert.equal(app.getState().memberships.length, 2);
        await app.persist.rehydrate();
        assert.deepEqual(app.getState().registrations, ["e1"]);
        await demoEventActions.rsvp("e1", false);
        await demoEventActions.rsvp("e1", false);
        assert.deepEqual(app.getState().registrations, []);
        await assert.rejects(demoEventActions.ticket("e1"), /RSVP first/);
      },
    );
    await t.test(
      "saving/removing is idempotent, cloned activity is isolated and QR contains no personal data",
      async () => {
        reset();
        await demoEventActions.rsvp("e1", true);
        await demoEventActions.save("e1", true);
        await demoEventActions.save("e1", true);
        assert.equal(app.getState().bookmarks.length, 1);
        const a = await demoEventActions.activity();
        a.goingIds.push("e2");
        a.savedIds.push("e2");
        assert.deepEqual(app.getState().registrations, ["e1"]);
        assert.equal(app.getState().bookmarks.length, 1);
        const ticket = await demoEventActions.ticket("e1");
        assert.equal(ticket.source, "demo");
        assert.equal(ticket.payload, "CAMPUSONE_DEMO_NOT_VALID_FOR_ENTRY|e1");
        for (const pii of [initial.id, initial.name, initial.email])
          assert.ok(!ticket.payload.includes(pii));
        await demoEventActions.save("e1", false);
        assert.equal(app.getState().bookmarks.length, 0);
      },
    );
    await t.test(
      "full/cancelled/past/closed/missing events cannot be booked; old RSVPs can always be removed",
      async () => {
        reset();
        for (const id of ["e5", "e15", "e16"])
          await assert.rejects(
            demoEventActions.rsvp(id, true),
            /full, closed, cancelled or already over/,
          );
        await assert.rejects(demoEventActions.rsvp("missing", true), /no longer available/);
        t.mock.timers.setTime(Date.parse("2026-10-16T17:30:00Z"));
        await assert.rejects(demoEventActions.rsvp("e1", true), /closed/);
        app.getState().setEventRegistration("e16", true);
        await assert.rejects(demoEventActions.ticket("e16"), /not available/);
        await demoEventActions.rsvp("e16", false);
        assert.deepEqual(app.getState().registrations, []);
        t.mock.timers.setTime(Date.parse("2026-10-11T12:00:00Z"));
      },
    );
    await t.test(
      "blocked storage is visit-only only after a verified memory write; real failures propagate",
      async () => {
        reset();
        denied = true;
        assert.equal((await demoEventActions.rsvp("e1", true)).persisted, false);
        assert.deepEqual(app.getState().registrations, ["e1"]);
        assert.equal((await demoEventActions.rsvp("e1", true)).persisted, false);
        assert.equal((await demoEventActions.save("e1", true)).persisted, false);
        assert.equal((await demoEventActions.save("e1", true)).persisted, false);
        denied = false;
        const original = app.getState().setEventRegistration;
        app.setState({
          setEventRegistration: () => {
            throw new Error("Actual RSVP mutation failed");
          },
        });
        try {
          await assert.rejects(demoEventActions.rsvp("e2", true), /Actual RSVP mutation failed/);
        } finally {
          app.setState({ setEventRegistration: original });
        }
      },
    );
    await t.test(
      "profile or role change during a catalog await cannot mutate the next owner",
      async () => {
        for (const swap of ["account", "email", "role"]) {
          reset();
          const event = await eventCatalogService.get("e1"),
            original = eventCatalogService.get;
          let resolveGet, started;
          const ready = new Promise((resolve) => {
            started = resolve;
          });
          eventCatalogService.get = () => {
            started();
            return new Promise((resolve) => {
              resolveGet = resolve;
            });
          };
          try {
            const pending = demoEventActions.rsvp("e1", true);
            await ready;
            auth.getState().setSession({
              user: {
                ...initial,
                ...(swap === "role"
                  ? { role: "club-executive" }
                  : swap === "email"
                    ? { email: "other@campusone.demo" }
                    : { id: "local-other", email: "other@campusone.demo" }),
              },
              source: "demo",
            });
            resolveGet(event);
            await assert.rejects(pending, /profile changed/);
            assert.deepEqual(app.getState().registrations, []);
          } finally {
            eventCatalogService.get = original;
          }
        }
      },
    );
    await t.test(
      "abort/guest/API sources are rejected and account changes clear persisted event data",
      async () => {
        reset();
        const controller = new AbortController();
        controller.abort();
        await assert.rejects(demoEventActions.rsvp("e1", true, { signal: controller.signal }), {
          name: "AbortError",
        });
        await demoEventActions.rsvp("e1", true);
        await demoEventActions.save("e1", true);
        auth.getState().setSession({
          user: { ...initial, id: "local-second", email: "second@campusone.demo" },
          source: "demo",
        });
        assert.deepEqual(app.getState().registrations, []);
        assert.deepEqual(app.getState().bookmarks, []);
        assert.ok(!saved.get("campusone-app").includes('"e1"'));
        auth.getState().signOut();
        await assert.rejects(demoEventActions.rsvp("e1", true), /Sign in/);
        auth.getState().setSession({ user: initial, source: "api" });
        await assert.rejects(demoEventActions.rsvp("e1", true), /local demo/);
        await app.persist.rehydrate();
        assert.deepEqual(app.getState().registrations, []);
      },
    );
  } finally {
    t.mock.timers.reset();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
