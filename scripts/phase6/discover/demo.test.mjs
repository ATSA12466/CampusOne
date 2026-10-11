import assert from "node:assert/strict";
import test from "node:test";
import { demoDiscoverActions } from "../../../src/services/discover/demo-actions.service.ts";
import { discoverCatalogService } from "../../../src/services/discover/discover.service.ts";
import { demoAuthService } from "../../../src/services/auth/demo-auth.service.ts";
import { demoEventActions } from "../../../src/services/events/demo-actions.service.ts";
import { demoClubActions } from "../../../src/services/clubs/demo-actions.service.ts";
test("demo cross-campus saves: real persistence, idempotence, storage truth, account/abort races", async (t) => {
  let denied = false;
  const saved = new Map();
  const storage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => {
      if (denied) throw new DOMException("Blocked", "SecurityError");
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
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  try {
    const { useAuthStore: auth } = await import(
        "../../../src/stores/auth-store.ts"
      ),
      { useAppStore: app } = await import("../../../src/stores/app-store.ts");
    const initial = demoAuthService.initialUser(),
      reset = () => {
        denied = false;
        auth.getState().setSession({ user: initial, source: "demo" });
        app.getState().resetDemo();
      };
    await t.test(
      "all eight categories save once, retain existing club executive seeds and survive rehydration",
      async () => {
        reset();
        const refs = [
          ["clubs", "club-1"],
          ["events", "e1"],
          ["resources", "r1"],
          ["opportunities", "o1"],
          ["accommodation", "h1"],
          ["marketplace", "mk1"],
          ["media", "md1"],
          ["lost-found", "lf1"],
        ].map(([category, id]) => ({ category, id }));
        for (const ref of refs) {
          assert.equal(
            (await demoDiscoverActions.save(ref, true)).persisted,
            true,
          );
          await demoDiscoverActions.save(ref, true);
        }
        assert.equal(app.getState().bookmarks.length, 8);
        assert.equal(app.getState().memberships.length, 2);
        await app.persist.rehydrate();
        assert.equal(app.getState().bookmarks.length, 8);
        const activity = await demoDiscoverActions.activity();
        assert.equal(activity.saved.length, 8);
        activity.saved.length = 0;
        assert.equal(app.getState().bookmarks.length, 8);
      },
    );
    await t.test(
      "Discover and existing Clubs/Events actions share the same desired saved records",
      async () => {
        reset();
        await demoDiscoverActions.save({ category: "events", id: "e1" }, true);
        await demoDiscoverActions.save(
          { category: "clubs", id: "club-1" },
          true,
        );
        assert.deepEqual((await demoEventActions.activity()).savedIds, ["e1"]);
        assert.deepEqual((await demoClubActions.activity()).savedIds, [
          "club-1",
        ]);
        await demoEventActions.save("e1", false);
        await demoClubActions.save("club-1", false);
        assert.deepEqual((await demoDiscoverActions.activity()).saved, []);
      },
    );
    await t.test(
      "explicit removal is idempotent and the legacy bookmark toggle remains compatible",
      async () => {
        reset();
        app.getState().toggleBookmark({
          id: "legacy",
          entityType: "resource",
          entityId: "r1",
        });
        assert.equal((await demoDiscoverActions.activity()).saved[0].id, "r1");
        await demoDiscoverActions.save(
          { category: "resources", id: "r1" },
          false,
        );
        await demoDiscoverActions.save(
          { category: "resources", id: "r1" },
          false,
        );
        assert.equal(app.getState().bookmarks.length, 0);
      },
    );
    await t.test(
      "denied storage reports verified visit-only, including an already-correct memory state",
      async () => {
        reset();
        denied = true;
        const ref = { category: "accommodation", id: "h1" };
        assert.equal(
          (await demoDiscoverActions.save(ref, true)).persisted,
          false,
        );
        assert.equal(app.getState().bookmarks.length, 1);
        assert.equal(
          (await demoDiscoverActions.save(ref, true)).persisted,
          false,
        );
        assert.equal(
          (await demoDiscoverActions.save(ref, false)).persisted,
          false,
        );
        assert.equal(app.getState().bookmarks.length, 0);
        denied = false;
      },
    );
    await t.test(
      "unrelated failed memory mutation is thrown, never disguised as visit-only",
      async () => {
        reset();
        const setter = app.getState().setBookmark;
        app.setState({
          setBookmark: () => {
            throw new Error("Not applied");
          },
        });
        try {
          await assert.rejects(
            demoDiscoverActions.save({ category: "events", id: "e1" }, true),
            /Not applied/,
          );
          assert.equal(app.getState().bookmarks.length, 0);
        } finally {
          app.setState({ setBookmark: setter });
        }
      },
    );
    await t.test(
      "profile/email/role/source changes during catalog await cannot apply an earlier owner action",
      async () => {
        for (const update of [
          { user: { ...initial, id: "different" } },
          { user: { ...initial, email: "different@example.test" } },
          { role: "club-executive" },
          { source: "api" },
        ]) {
          reset();
          const get = discoverCatalogService.get;
          let entered, release;
          const ready = new Promise((r) => (entered = r)),
            gate = new Promise((r) => (release = r));
          discoverCatalogService.get = async (...args) => {
            entered();
            await gate;
            return get(...args);
          };
          try {
            const work = demoDiscoverActions.save(
              { category: "events", id: "e1" },
              true,
            );
            const rejection = assert.rejects(work, /profile changed/);
            await ready;
            auth.setState(update);
            release();
            await rejection;
            assert.equal(app.getState().bookmarks.length, 0);
          } finally {
            release();
            discoverCatalogService.get = get;
          }
        }
      },
    );
    await t.test(
      "missing/unsafe IDs, guest/API profiles and cancelled reads cannot fabricate a save",
      async () => {
        reset();
        await assert.rejects(
          demoDiscoverActions.save({ category: "events", id: "missing" }, true),
          /no longer available/,
        );
        await assert.rejects(
          demoDiscoverActions.save({ category: "events", id: "../bad" }, true),
        );
        const controller = new AbortController();
        controller.abort();
        await assert.rejects(
          demoDiscoverActions.save({ category: "events", id: "e1" }, true, {
            signal: controller.signal,
          }),
          (e) => e.name === "AbortError",
        );
        auth.setState({ source: "api" });
        await assert.rejects(demoDiscoverActions.activity(), /local demo/);
        auth.setState({ source: "demo", user: null });
        await assert.rejects(demoDiscoverActions.activity(), /Sign in/);
        assert.equal(app.getState().bookmarks.length, 0);
      },
    );
    await t.test(
      "new-account and sign-out clear all eight saved types from memory and persisted activity",
      async () => {
        reset();
        await demoDiscoverActions.save(
          { category: "accommodation", id: "h1" },
          true,
        );
        await demoDiscoverActions.save(
          { category: "lost-found", id: "lf1" },
          true,
        );
        auth.getState().setSession({
          source: "demo",
          user: { ...initial, id: "local-fresh", email: "new@example.test" },
        });
        assert.equal(app.getState().bookmarks.length, 0);
        await demoDiscoverActions.save({ category: "events", id: "e1" }, true);
        auth.getState().signOut();
        assert.equal(app.getState().bookmarks.length, 0);
        assert.deepEqual(
          JSON.parse(saved.get("campusone-app")).state.bookmarks,
          [],
        );
      },
    );
  } finally {
    for (const [key, descriptor] of originals)
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
  }
});
