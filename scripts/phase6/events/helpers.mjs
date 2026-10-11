import assert from "node:assert/strict";
import { waitForScreen } from "../../audit/browser.mjs";
import { authContext, stored } from "../../phase5/helpers.mjs";
import {
  capture as baseCapture,
  focusIs,
  checkTrap,
  visit,
} from "../../phase3/helpers.mjs";
export { authContext, stored, focusIs, checkTrap, visit };
export const eventCards = (page) => page.locator("article[aria-label]");
export async function capture(page, output, name) {
  const y = await page.evaluate(() => scrollY);
  if (!(await page.getByRole("dialog").count())) {
    const images = page.locator("main img");
    for (let i = 0; i < (await images.count()); i++) {
      const image = images.nth(i);
      if (
        !(await image.isVisible()) ||
        (await image.evaluate((node) => !!node.closest('[aria-hidden="true"]')))
      )
        continue;
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((node) =>
        node.complete
          ? undefined
          : new Promise((resolve) => {
              node.addEventListener("load", resolve, { once: true });
              node.addEventListener("error", resolve, { once: true });
            }),
      );
    }
    await page.evaluate((y) => scrollTo(0, y), y);
  }
  if (!(await page.getByRole("dialog").count()))
    await page.evaluate(() => scrollTo(0, 0));
  await waitForScreen(page);
  const result = await baseCapture(page, output, name);
  assert.deepEqual(result.metrics.smallTargets, [], `44px: ${name}`);
  return result;
}
export async function rsvp(page) {
  await page.getByRole("button", { name: "RSVP", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("checkbox").check();
  await dialog
    .getByRole("button", { name: "Confirm demo RSVP", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  await page
    .getByRole("button", { name: "Demo ticket", exact: true })
    .waitFor();
}
export function trackErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}
