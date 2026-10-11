import assert from "node:assert/strict";
import test from "node:test";
import { demoClubActions } from "../../../src/services/clubs/demo-actions.service.ts";
import { clubCatalogService } from "../../../src/services/clubs/catalog.service.ts";
import { demoAuthService } from "../../../src/services/auth/demo-auth.service.ts";
test("demo actions: persistence, roles, reapplication, abort and account races", async (t) => {
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
  try {
    const { useAuthStore: auth } = await import("../../../src/stores/auth-store.ts"),
      { useAppStore: app } = await import("../../../src/stores/app-store.ts");
    const initial = demoAuthService.initialUser(),
      reset = () => {
        denied = false;
        auth.getState().setSession({ user: initial, source: "demo" });
        app.getState().resetDemo();
      };
    await t.test(
      "request trims note, preserves seeds, is idempotent and persists across hydration",
      async () => {
        reset();
        assert.equal((await demoClubActions.request("club-3", "  Hello Ghana  ")).persisted, true);
        await demoClubActions.request("club-3", "duplicate");
        const record = app.getState().memberships.find((m) => m.clubId === "club-3");
        assert.equal(record.status, "pending");
        assert.equal(record.note, "Hello Ghana");
        assert.equal(record.applicantName, initial.name);
        assert.match(record.requestedAt, /^\d{4}-\d{2}-\d{2}$/);
        assert.equal(app.getState().memberships.length, 3);
        await app.persist.rehydrate();
        assert.equal(app.getState().memberships.find((m) => m.id === record.id).status, "pending");
      },
    );
    await t.test(
      "student cannot review; executive approves and cannot overwrite an already-reviewed record",
      async () => {
        reset();
        await assert.rejects(demoClubActions.review("m2", "approved"), /executive role/);
        auth
          .getState()
          .setSession({ user: { ...initial, role: "club-executive" }, source: "demo" });
        await demoClubActions.review("m2", "approved");
        assert.equal(app.getState().memberships.find((m) => m.id === "m2").status, "approved");
        await assert.rejects(demoClubActions.review("m2", "rejected"), /already changed/);
      },
    );
    await t.test(
      "declined membership reuses its record and becomes pending on reapply",
      async () => {
        reset();
        auth
          .getState()
          .setSession({ user: { ...initial, role: "club-executive" }, source: "demo" });
        await demoClubActions.review("m2", "rejected");
        auth.getState().setSession({ user: initial, source: "demo" });
        await demoClubActions.request("club-2", "Trying again");
        assert.equal(app.getState().memberships.find((m) => m.id === "m2").status, "pending");
        assert.equal(app.getState().memberships.length, 2);
      },
    );
    await t.test(
      "withdraw/leave only removes the current profile; save/remove is idempotent and cloned activity is isolated",
      async () => {
        reset();
        app.setState({
          memberships: [
            ...app.getState().memberships,
            { id: "other", clubId: "club-2", userId: "another", status: "pending" },
          ],
        });
        await demoClubActions.withdraw("club-2");
        assert.ok(app.getState().memberships.some((m) => m.id === "other"));
        assert.ok(!app.getState().memberships.some((m) => m.id === "m2"));
        await demoClubActions.withdraw("club-1");
        await demoClubActions.save("club-3", true);
        await demoClubActions.save("club-3", true);
        assert.equal(app.getState().bookmarks.length, 1);
        const activity = await demoClubActions.activity();
        activity.savedIds.push("injected");
        assert.equal(app.getState().bookmarks.length, 1);
        await app.persist.rehydrate();
        assert.equal(app.getState().bookmarks[0].entityType, "club");
        await demoClubActions.save("club-3", false);
        assert.equal(app.getState().bookmarks.length, 0);
      },
    );
    await t.test(
      "blocked persistence is truthful only when memory really changed; unrelated action failures propagate",
      async () => {
        reset();
        denied = true;
        assert.equal((await demoClubActions.save("club-4", true)).persisted, false);
        assert.ok(app.getState().bookmarks.some((b) => b.entityId === "club-4"));
        denied = false;
        const original = app.getState().toggleBookmark;
        app.setState({
          toggleBookmark: () => {
            throw new Error("Actual mutation failed");
          },
        });
        try {
          await assert.rejects(demoClubActions.save("club-3", true), /Actual mutation failed/);
        } finally {
          app.setState({ toggleBookmark: original });
        }
      },
    );
    await t.test(
      "profile swap during catalogue await does not apply the previous profile action",
      async () => {
        reset();
        const club = await clubCatalogService.get("club-3"),
          original = clubCatalogService.get;
        let resolveGet, started;
        const ready = new Promise((resolve) => {
          started = resolve;
        });
        clubCatalogService.get = () => {
          started();
          return new Promise((resolve) => {
            resolveGet = resolve;
          });
        };
        try {
          const pending = demoClubActions.request("club-3", "Previous profile");
          await ready;
          auth
            .getState()
            .setSession({
              user: { ...initial, id: "local-other", email: "other@campusone.demo" },
              source: "demo",
            });
          resolveGet(club);
          await assert.rejects(pending, /profile changed/);
          assert.deepEqual(app.getState().memberships, []);
        } finally {
          clubCatalogService.get = original;
        }
      },
    );
    await t.test(
      "bad notes/missing clubs/abort/guest or API profiles cannot fabricate a demo mutation",
      async () => {
        reset();
        await assert.rejects(demoClubActions.request("club-3", "x".repeat(401)));
        await assert.rejects(demoClubActions.request("does-not-exist", ""), /no longer available/);
        const controller = new AbortController();
        controller.abort();
        await assert.rejects(demoClubActions.save("club-3", true, { signal: controller.signal }), {
          name: "AbortError",
        });
        auth.getState().signOut();
        await assert.rejects(demoClubActions.request("club-3", ""), /Sign in/);
        auth.getState().setSession({ user: initial, source: "api" });
        await assert.rejects(demoClubActions.save("club-3", true), /local demo/);
      },
    );
    await t.test(
      "new profile and sign-out remove membership notes and club saves from memory and persisted state",
      async () => {
        reset();
        await demoClubActions.request("club-3", "Private introduction");
        await demoClubActions.save("club-3", true);
        auth
          .getState()
          .setSession({
            user: { ...initial, id: "local-second", email: "second@campusone.demo" },
            source: "demo",
          });
        assert.deepEqual(app.getState().memberships, []);
        assert.deepEqual(app.getState().bookmarks, []);
        assert.ok(!saved.get("campusone-app").includes("Private introduction"));
        auth.getState().signOut();
        await app.persist.rehydrate();
        assert.deepEqual(app.getState().memberships, []);
      },
    );
  } finally {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
