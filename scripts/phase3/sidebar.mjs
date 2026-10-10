import assert from "node:assert/strict";
import { seedOnboarding, restrictToApp, waitForScreen } from "../audit/browser.mjs";
import { visit } from "./helpers.mjs";
export async function checkSidebar(browser, baseUrl) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await seedOnboarding(context);
  await restrictToApp(context, baseUrl);
  try {
    const first = await context.newPage();
    await visit(first, baseUrl);
    await first.getByRole("button", { name: "Collapse sidebar" }).click();
    await first.waitForFunction(() => localStorage.getItem("campusone-sidebar") === "compact");
    await first.reload({ waitUntil: "networkidle" });
    assert.equal(await first.locator("html").getAttribute("data-sidebar"), "compact");
    const second = await context.newPage();
    await visit(second, baseUrl);
    assert.equal(await second.locator("html").getAttribute("data-sidebar"), "compact");
    await second.getByRole("button", { name: "Expand sidebar" }).click();
    await first.waitForFunction(() => document.documentElement.dataset.sidebar === "expanded");
    await second.getByRole("button", { name: "Collapse sidebar" }).click();
    await first.waitForFunction(() => document.documentElement.dataset.sidebar === "compact");
    await second.evaluate(() => localStorage.clear());
    await first.waitForFunction(() => document.documentElement.dataset.sidebar === "expanded");
  } finally {
    await context.close();
  }
  const denied = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await denied.addInitScript(() => {
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === "campusone-sidebar") throw new Error("private mode");
      return get.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === "campusone-sidebar") throw new Error("private mode");
      return set.call(this, key, value);
    };
  });
  await seedOnboarding(denied);
  try {
    const page = await denied.newPage();
    await visit(page, baseUrl);
    assert.equal(await page.locator("html").getAttribute("data-sidebar"), "expanded");
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await page.waitForFunction(() => document.documentElement.dataset.sidebar === "compact");
    await page.getByRole("button", { name: "Expand sidebar" }).click();
    await page.waitForFunction(() => document.documentElement.dataset.sidebar === "expanded");
  } finally {
    await denied.close();
  }
  const early = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await early.addInitScript(() => localStorage.setItem("campusone-sidebar", "compact"));
  await early.route("**/_next/static/**/*.js", (route) => route.abort("blockedbyclient"));
  try {
    const page = await early.newPage();
    await page.goto(`${baseUrl}/home`, { waitUntil: "networkidle" });
    await waitForScreen(page);
    assert.equal(await page.locator("html").getAttribute("data-sidebar"), "compact");
    assert.equal(
      await page.locator(".campus-sidebar").evaluate((node) => node.getBoundingClientRect().width),
      88,
    );
    assert.equal(
      await page.locator(".campus-content").evaluate((node) => getComputedStyle(node).paddingLeft),
      "88px",
    );
  } finally {
    await early.close();
  }
  return {
    reload: true,
    crossTab: true,
    storageClear: true,
    privateStorageFallback: true,
    compactBeforeHydration: true,
  };
}
