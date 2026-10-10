import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readdir } from "node:fs/promises";
const {
  navigationGroups,
  destinations,
  mobileDestinations,
  currentDestination,
  isDestinationActive,
} = await import("../../src/config/navigation.ts");
const { sidebarInitScript, sidebarStorageKey } = await import("../../src/config/sidebar.ts");
test("all 24 static student routes have one grouped navigation destination", async () => {
  const files = await readdir("src/app/(student)", { recursive: true });
  const routes = files
    .filter((file) => file.endsWith("/page.tsx") && !file.includes("["))
    .map((file) => `/${file.replace(/\/page\.tsx$/, "")}`);
  assert.equal(destinations.length, 24);
  assert.equal(navigationGroups.length, 5);
  assert.deepEqual(new Set(destinations.map((item) => item.href)), new Set(routes));
  assert.equal(new Set(destinations.map((item) => item.href)).size, destinations.length);
  for (const item of destinations) {
    assert.ok(item.label && item.description && item.icon);
    assert.equal(currentDestination(item.href), item);
  }
});
test("mobile tabs are four unique destinations; detail-prefix activation is bounded", () => {
  assert.deepEqual(
    mobileDestinations.map((item) => item.href),
    ["/home", "/discover", "/tasks", "/community"],
  );
  assert.equal(currentDestination("/clubs/club-1").href, "/clubs");
  assert.equal(currentDestination("/academics/resources/r1").href, "/academics");
  assert.equal(isDestinationActive("/events-archive", "/events"), false);
  assert.equal(currentDestination("/unknown"), undefined);
});
test("sidebar prepaint defaults safely and honors compact storage without request data", () => {
  for (const preference of [null, "invalid", "expanded", "compact"]) {
    const root = { dataset: {} };
    vm.runInNewContext(sidebarInitScript, {
      document: { documentElement: root },
      localStorage: {
        getItem(key) {
          assert.equal(key, sidebarStorageKey);
          return preference;
        },
      },
    });
    assert.equal(root.dataset.sidebar, preference === "compact" ? "compact" : "expanded");
  }
  const root = { dataset: {} };
  vm.runInNewContext(sidebarInitScript, {
    document: { documentElement: root },
    localStorage: {
      getItem() {
        throw new Error("private mode");
      },
    },
  });
  assert.equal(root.dataset.sidebar, "expanded");
});
