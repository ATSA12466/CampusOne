import assert from "node:assert/strict";
import { homeContext, visit } from "./helpers.mjs";
export async function checkClock(browser, baseUrl) {
  const context = await homeContext(browser, baseUrl),
    page = await context.newPage();
  try {
    await page.clock.install({ time: new Date("2026-10-12T10:59:00Z") });
    await visit(page, baseUrl);
    await page.getByText("Happening now", { exact: true }).waitFor();
    await page.clock.fastForward("01:00");
    await page.getByText("Your next class", { exact: true }).waitFor();
    await page.getByRole("heading", { name: "Database Systems", exact: true }).waitFor();
    await page.clock.setSystemTime(new Date("2027-01-01T00:00:01Z"));
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await page
      .getByRole("heading", { name: "Make a little space for focus.", exact: true })
      .waitFor({ state: "hidden" });
    assert.equal(await page.locator('[aria-roledescription="slide"]').count(), 1);
    return { minuteBoundaryNowNext: true, visibilityRefresh: true, campaignExpiresWhileOpen: true };
  } finally {
    await context.close();
  }
}
