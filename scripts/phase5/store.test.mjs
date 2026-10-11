import assert from "node:assert/strict";
import test from "node:test";

test("real store mutations preserve executive approvals until explicit sign-out clears all account activity", async () => {
  const saved = new Map();
  const storage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
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
    const { useAuthStore: auth } = await import("../../src/stores/auth-store.ts");
    const { useAppStore: app } = await import("../../src/stores/app-store.ts");
    const { useOnboardingStore: tour } = await import("../../src/stores/onboarding-store.ts");
    const { demoAuthService } = await import("../../src/services/auth/demo-auth.service.ts");
    const initial = demoAuthService.initialUser();
    auth.getState().setSession({ user: initial, source: "demo" });
    app.getState().resetDemo();
    app.getState().toggleBookmark({ id: "saved-test", entityId: "r1", entityType: "resource" });
    const pending = app.getState().memberships.find((item) => item.status === "pending");
    assert.ok(pending);
    auth.getState().setSession({ user: { ...initial, role: "club-executive" }, source: "demo" });
    assert.equal(app.getState().bookmarks.length, 1);
    assert.ok(app.getState().memberships.some((item) => item.id === pending.id));
    app.getState().reviewMembership(pending.id, "approved");
    assert.equal(
      app.getState().memberships.find((item) => item.id === pending.id).status,
      "approved",
    );
    await app.persist.rehydrate();
    assert.equal(
      app.getState().memberships.find((item) => item.id === pending.id).status,
      "approved",
    );
    auth.getState().setPhoto({
      file: new File(["fixture"], "fixture.webp", { type: "image/webp" }),
      width: 120,
      height: 120,
      originalBytes: 7,
    });
    assert.ok(auth.getState().photo.src.startsWith("blob:"));
    assert.ok(!saved.get("campusone-auth").includes("blob:"));
    tour.getState().setPreferences({
      name: "Private name",
      programme: "BSc Computer Science",
      level: "Level 200",
      interests: ["Clubs & societies"],
      portrait: "initials",
    });
    assert.equal(auth.getState().signOut(), true);
    assert.equal(auth.getState().user, null);
    assert.equal(auth.getState().role, "student");
    assert.equal(auth.getState().photo, null);
    for (const key of [
      "tasks",
      "bookmarks",
      "memberships",
      "registrations",
      "notifications",
      "srcRequests",
    ])
      assert.deepEqual(app.getState()[key], [], key);
    assert.equal(tour.getState().preferences.name, "");
    await auth.persist.rehydrate();
    await app.persist.rehydrate();
    assert.equal(auth.getState().user, null);
    assert.equal(auth.getState().role, "student");
    assert.deepEqual(app.getState().bookmarks, []);
  } finally {
    for (const [key, original] of originals) {
      if (original) Object.defineProperty(globalThis, key, original);
      else delete globalThis[key];
    }
  }
});
test("remember-disabled and API sessions do not persist an authenticated profile or elevated role", async () => {
  const { useAuthStore: auth } = await import("../../src/stores/auth-store.ts");
  const { safeStorage } = await import("../../src/lib/auth/persistence.ts");
  const { demoAuthService } = await import("../../src/services/auth/demo-auth.service.ts");
  const storage = new Map();
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        setItem: (key, value) => storage.set(key, value),
        getItem: (key) => storage.get(key) ?? null,
      },
    },
  });
  try {
    for (const [source, remember] of [
      ["demo", false],
      ["api", true],
    ]) {
      auth
        .getState()
        .setSession(
          { user: { ...demoAuthService.initialUser(), role: "administrator" }, source },
          remember,
        );
      const data = JSON.parse(safeStorage.getItem("campusone-auth")).state;
      assert.equal(data.user, null);
      assert.equal(data.role, "student");
      assert.ok(!("photo" in data));
      assert.ok(!("password" in data));
    }
  } finally {
    if (original) Object.defineProperty(globalThis, "window", original);
    else delete globalThis.window;
  }
});

test("returning demo sign-in retains a local profile, but a new registration with the same email uses the new name", async () => {
  const { useAuthStore: auth } = await import("../../src/stores/auth-store.ts");
  const { demoAuthActions } = await import("../../src/services/auth/demo-actions.service.ts");
  const email = "esi@campusone.demo",
    password = "preview-only-password";
  const first = await demoAuthActions.register({ name: "Esi Owusu", email, password });
  auth.getState().setSession(first);
  const id = auth.getState().user.id;
  auth.getState().setSession(await demoAuthActions.signIn({ email, password, role: "student" }));
  assert.equal(auth.getState().user.name, "Esi Owusu");
  assert.equal(auth.getState().user.id, id);
  const next = await demoAuthActions.register({ name: "Esi Mensah", email, password });
  auth.getState().setSession(next);
  assert.equal(auth.getState().user.name, "Esi Mensah");
  assert.notEqual(auth.getState().user.id, id);
});
