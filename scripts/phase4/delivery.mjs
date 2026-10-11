import assert from "node:assert/strict";
import {
  homeContext,
  visit,
  capture,
  focusIs,
  chunksWith,
  scriptName,
  selectVideo,
} from "./helpers.mjs";
export async function checkHomeDelivery(browser, baseUrl, output) {
  const player = await chunksWith("Text alternative"),
    toast = await chunksWith("toast-enter flex items-start gap-3"),
    themes = await chunksWith('value:"dark",label:"Dark"');
  assert.ok(player.length && toast.length && themes.length);
  const context = await homeContext(browser, baseUrl, 768),
    page = await context.newPage(),
    scripts = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") scripts.push(scriptName(request));
  });
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await context.route("**/_next/static/chunks/*.js", async (route) => {
    if (player.includes(scriptName(route.request()))) await gate;
    await route.continue();
  });
  let initial;
  const shots = [];
  try {
    await visit(page, baseUrl);
    initial = [...scripts];
    for (const chunk of [...player, ...toast, ...themes])
      assert.equal(initial.includes(chunk), false, `Eager closed widget: ${chunk}`);
    const trigger = await selectVideo(page);
    await trigger.click();
    await page.getByRole("button", { name: "Opening preview…", exact: true }).waitFor();
    const delivered = page.waitForResponse((response) =>
      player.includes(new URL(response.url()).pathname.split("/").at(-1)),
    );
    await page.keyboard.press("Escape");
    await focusIs(page, trigger);
    release();
    await page.waitForFunction(
      () =>
        document
          .querySelector('[aria-haspopup="dialog"][aria-expanded="false"]')
          ?.getAttribute("aria-busy") !== "true",
    );
    // Await the actual chunk completion, not an arbitrary sleep or a screenshot race.
    await delivered;
    assert.equal(await page.getByRole("dialog").count(), 0);
    await trigger.click();
    const loadedPlayer = page.getByRole("dialog", {
      name: "Pause. Breathe. Come back brighter.",
      exact: true,
    });
    await loadedPlayer.waitFor();
    await loadedPlayer.getByRole("button", { name: "Close dialog", exact: true }).focus();
    await page.keyboard.press("Escape");
    await focusIs(page, trigger);
    const themeTrigger = page.getByRole("button", { name: /^Change appearance;/ });
    await themeTrigger.click();
    const menu = page.getByRole("menu", { name: "Appearance", exact: true });
    await menu.waitFor();
    await page.keyboard.press("Control+k");
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.ok(await menu.isVisible());
    shots.push(await capture(page, output, "768-light-appearance-menu"));
    await menu.getByRole("menuitemcheckbox", { name: "Dark", exact: true }).click();
    await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
    await focusIs(page, themeTrigger);
    assert.ok(themes.some((chunk) => scripts.includes(chunk)));
    await page
      .getByRole("button", { name: /^Complete / })
      .first()
      .click();
    await page.getByText("Demo task updated", { exact: true }).waitFor();
    assert.ok(toast.some((chunk) => scripts.includes(chunk)));
    shots.push(await capture(page, output, "768-dark-lazy-toast"));
    await page.getByRole("button", { name: "Dismiss notification", exact: true }).click();
  } finally {
    release();
    await context.close();
  }
  const failed = await homeContext(browser, baseUrl),
    failedPage = await failed.newPage();
  let blocked = true;
  await failed.route("**/_next/static/chunks/*.js", (route) =>
    blocked && player.includes(scriptName(route.request()))
      ? route.abort("failed")
      : route.continue(),
  );
  try {
    await visit(failedPage, baseUrl);
    await (await selectVideo(failedPage)).click();
    await failedPage.getByRole("alert").filter({ hasText: "The player couldn't load" }).waitFor();
    shots.push(await capture(failedPage, output, "360-light-player-chunk-error"));
    blocked = false;
    await Promise.all([
      failedPage.waitForNavigation({ waitUntil: "networkidle" }),
      failedPage.getByRole("button", { name: "reload the page", exact: true }).click(),
    ]);
    await (await selectVideo(failedPage)).click();
    await failedPage
      .getByRole("dialog", { name: "Pause. Breathe. Come back brighter.", exact: true })
      .waitFor();
  } finally {
    await failed.close();
  }
  const fallback = await homeContext(browser, baseUrl),
    fallbackPage = await fallback.newPage();
  await fallback.route("**/_next/static/chunks/*.js", (route) =>
    toast.includes(scriptName(route.request())) ? route.abort("failed") : route.continue(),
  );
  try {
    await visit(fallbackPage, baseUrl);
    await fallbackPage
      .getByRole("button", { name: /^Complete / })
      .first()
      .click();
    await fallbackPage.getByRole("status").filter({ hasText: "Demo task updated" }).waitFor();
    shots.push(await capture(fallbackPage, output, "360-light-toast-native-fallback"));
    await fallbackPage.getByRole("button", { name: "Dismiss notification", exact: true }).click();
    await fallbackPage.getByText("Demo task updated", { exact: true }).waitFor({ state: "hidden" });
  } finally {
    await fallback.close();
  }
  const failure = await homeContext(browser, baseUrl, 768),
    failurePage = await failure.newPage();
  await failure.route("**/_next/static/chunks/*.js", (route) =>
    themes.includes(scriptName(route.request())) ? route.abort("failed") : route.continue(),
  );
  try {
    await visit(failurePage, baseUrl);
    await failurePage.getByRole("button", { name: /^Change appearance;/ }).click();
    await failurePage
      .getByRole("alert")
      .filter({ hasText: "Appearance menu unavailable" })
      .waitFor();
    shots.push(await capture(failurePage, output, "768-light-appearance-chunk-error"));
  } finally {
    await failure.close();
  }
  return {
    initialScripts: initial,
    playerThemeAndToastDeferred: true,
    cancelInFlightPlayer: true,
    playerChunkReloadRecovery: true,
    toastNativeFallback: true,
    appearanceFailureIsVisible: true,
    shots,
  };
}
