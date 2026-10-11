import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { seedOnboarding, restrictToApp } from "../audit/browser.mjs";
import { capture, closeSearch, focusIs, visit } from "./helpers.mjs";
async function chunksWith(text) {
  const directory = ".next/static/chunks";
  const files = (await readdir(directory)).filter((file) => file.endsWith(".js"));
  const matches = await Promise.all(
    files.map(async (file) =>
      (await readFile(`${directory}/${file}`, "utf8")).includes(text) ? file : null,
    ),
  );
  return matches.filter(Boolean);
}
export async function checkDelivery(browser, baseUrl, output) {
  const searchChunks = await chunksWith("Search campus content");
  const menuChunks = await chunksWith("Your campus, within reach");
  const fixtureChunks = await chunksWith("Controlled showcase failure");
  assert.ok(searchChunks.length && menuChunks.length && fixtureChunks.length);
  const context = await browser.newContext({
    viewport: { width: 360, height: 900 },
    reducedMotion: "reduce",
  });
  await seedOnboarding(context);
  await restrictToApp(context, baseUrl);
  const page = await context.newPage();
  const scripts = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script")
      scripts.push(new URL(request.url()).pathname.split("/").at(-1));
  });
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await context.route("**/_next/static/chunks/*.js", async (route) => {
    if (searchChunks.includes(new URL(route.request().url()).pathname.split("/").at(-1)))
      await gate;
    await route.continue();
  });
  let initial;
  try {
    await visit(page, baseUrl);
    initial = [...scripts];
    for (const file of [...searchChunks, ...menuChunks, ...fixtureChunks])
      assert.equal(initial.includes(file), false, `Eager closed-overlay/showcase chunk: ${file}`);
    const trigger = page.getByRole("button", { name: "Search campus", exact: true });
    await trigger.click();
    await page.getByRole("status").filter({ hasText: "Opening your campus…" }).waitFor();
    await page.keyboard.press("Escape");
    await page
      .getByRole("status")
      .filter({ hasText: "Opening your campus…" })
      .waitFor({ state: "hidden" });
    release();
    await page.waitForFunction(
      () => !document.getElementById("campus-search-trigger").hasAttribute("aria-busy"),
    );
    assert.equal(await page.getByRole("dialog").count(), 0);
    await trigger.click();
    const search = page.getByRole("dialog", { name: "Search campus", exact: true });
    await search.getByRole("listbox").getByRole("option").first().waitFor();
    assert.equal(
      searchChunks.some((file) => scripts.includes(file)),
      true,
    );
    await closeSearch(page, trigger);
    const more = page.getByRole("button", { name: "More", exact: true });
    await more.click();
    const menu = page.getByRole("dialog", { name: "Your campus, within reach.", exact: true });
    await menu.waitFor();
    assert.equal(
      menuChunks.some((file) => scripts.includes(file)),
      true,
    );
    await page.keyboard.press("Control+k");
    await search.waitFor();
    await menu.waitFor({ state: "hidden" });
    await focusIs(page, search.getByRole("combobox", { name: "Search campus content" }));
    assert.equal(await page.getByRole("dialog").count(), 1);
    await closeSearch(page, trigger);
  } finally {
    release();
    await context.close();
  }
  const failed = await browser.newContext({
    viewport: { width: 360, height: 900 },
    reducedMotion: "reduce",
  });
  await seedOnboarding(failed);
  await restrictToApp(failed, baseUrl);
  let blocked = false;
  let failRequests = true;
  await failed.route("**/_next/static/chunks/*.js", (route) => {
    if (
      failRequests &&
      searchChunks.includes(new URL(route.request().url()).pathname.split("/").at(-1))
    ) {
      blocked = true;
      return route.abort("failed");
    }
    return route.continue();
  });
  let failureCapture;
  try {
    const page = await failed.newPage();
    await visit(page, baseUrl);
    const trigger = page.getByRole("button", { name: "Search campus", exact: true });
    await trigger.click();
    await page.getByRole("alert").filter({ hasText: "This panel couldn't open." }).waitFor();
    assert.equal(blocked, true);
    failureCapture = await capture(page, output, "360-light-panel-load-error");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await focusIs(page, trigger);
    await trigger.click();
    await page.getByRole("alert").filter({ hasText: "This panel couldn't open." }).waitFor();
    // Next 16.4 may retry a failed chunk request. Keep the outage persistent until
    // the user explicitly reloads, rather than relying on a one-request failure.
    failRequests = false;
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }),
      page.getByRole("button", { name: "Reload page", exact: true }).click(),
    ]);
    await trigger.click();
    await page.getByRole("dialog", { name: "Search campus", exact: true }).waitFor();
    await closeSearch(page, trigger);
  } finally {
    await failed.close();
  }
  return {
    initialScriptCount: initial.length,
    searchAndMenuDeferred: true,
    developmentFixturesDeferred: true,
    cancelDuringChunkLoad: true,
    oneOverlayAtATime: true,
    menuToSearchFocus: true,
    chunkFailureReloadRecovery: true,
    failureCapture,
  };
}
