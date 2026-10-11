import assert from "node:assert/strict";
import { homeContext, visit, capture, focusIs } from "./helpers.mjs";
import { screenMetrics } from "../audit/browser.mjs";
export async function checkStates(browser, dev, production, output) {
  const captures = [];
  const context = await homeContext(browser, dev),
    page = await context.newPage();
  try {
    for (const mode of ["empty", "inactive", "partial", "offline", "truncated"]) {
      await visit(page, dev, `/home?home-preview=${mode}`);
      await page
        .getByText(`Development-only Home fixture: ${mode}. Not live campus data.`, { exact: true })
        .waitFor();
      if (mode !== "truncated")
        assert.equal(await page.locator('section[aria-label="Featured ads and video"]').count(), 0);
      if (["partial", "offline"].includes(mode))
        assert.equal(
          await page.getByRole("button", { name: "Retry home feed", exact: true }).count(),
          1,
        );
      if (mode === "empty") {
        assert.ok(
          await page
            .getByText("No classes in your demo timetable. You have a little room to breathe.")
            .isVisible(),
        );
        assert.ok(await page.getByText(/No upcoming events in this feed/).isVisible());
      }
      if (mode === "truncated")
        await page.getByRole("status").filter({ hasText: "bounded feed preview" }).waitFor();
      captures.push(await capture(page, output, `360-light-feed-${mode}`));
    }
    await visit(page, dev, `/home?home-preview=recover&run=browser-${Date.now()}`);
    await page.getByRole("button", { name: "Retry home feed", exact: true }).click();
    await page
      .getByRole("button", { name: "Retry home feed", exact: true })
      .waitFor({ state: "hidden" });
    await page.locator('[aria-roledescription="carousel"]').waitFor();
    captures.push(await capture(page, output, "360-light-feed-recovered"));
    // Intentional clipping is accepted, but genuinely misplaced root content is not.
    assert.deepEqual((await page.evaluate(screenMetrics)).overflowing, []);
    await page.evaluate(() => {
      const node = document.createElement("div");
      node.id = "audit-overflow-probe";
      node.style.cssText =
        "position:absolute;left:calc(100vw + 200px);top:0;width:44px;height:44px";
      node.textContent = "probe";
      document.body.append(node);
    });
    assert.ok(
      (await page.evaluate(screenMetrics)).overflowing.some((node) => node.text === "probe"),
    );
    await page.locator("#audit-overflow-probe").evaluate((node) => node.remove());
  } finally {
    await context.close();
  }
  const denied = await homeContext(browser, production),
    deniedPage = await denied.newPage();
  await denied.addInitScript(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "campusone-app") throw new Error("private storage");
      return set.call(this, key, value);
    };
  });
  try {
    await visit(deniedPage, production);
    await deniedPage
      .getByRole("button", { name: /^Complete / })
      .first()
      .click();
    await deniedPage.getByRole("status").filter({ hasText: "storage is unavailable" }).waitFor();
    captures.push(await capture(deniedPage, output, "360-light-task-storage-error"));
    const undo = deniedPage.getByRole("button", { name: "Undo", exact: true });
    await focusIs(deniedPage, undo);
    await undo.click();
    assert.equal(
      await deniedPage.getByRole("progressbar", { name: "Completed tasks" }).getAttribute("value"),
      "0",
    );
  } finally {
    await denied.close();
  }
  const staticContext = await homeContext(browser, production),
    staticPage = await staticContext.newPage();
  await staticContext.route("**/_next/**/*.js", (route) => route.abort("blockedbyclient"));
  try {
    await visit(staticPage, production, "/home?home-preview=empty");
    assert.equal(await staticPage.getByText(/Development-only Home fixture/).count(), 0);
    assert.equal(
      await staticPage.locator('section[aria-label="Featured ads and video"]').count(),
      1,
    );
    for (const selector of ['section[aria-labelledby="home-clubs-title"] img', "article img"]) {
      const image = staticPage.locator(selector).first();
      assert.ok(
        await image.evaluate(
          (node) =>
            node.complete && node.naturalWidth > 0 && getComputedStyle(node).opacity === "1",
        ),
      );
    }
    captures.push(await capture(staticPage, output, "360-light-images-before-hydration"));
  } finally {
    await staticContext.close();
  }
  return {
    captures,
    noInactiveAdSlot: true,
    partialAndTotalErrors: true,
    feedRetryRecovery: true,
    honestStorageFailure: true,
    imagesVisibleWithoutHydration: true,
    previewsAbsentInProduction: true,
    clippingMetricStillFindsGenuineOverflow: true,
  };
}
