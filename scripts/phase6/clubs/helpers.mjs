import assert from "node:assert/strict";
import { waitForScreen } from "../../audit/browser.mjs";
import { authContext, stored } from "../../phase5/helpers.mjs";
import { capture as baseCapture, focusIs, checkTrap, visit } from "../../phase3/helpers.mjs";
export { authContext, stored, focusIs, checkTrap, visit };
export const clubCards = (page) => page.locator('article[aria-labelledby^="club-title-"]');
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
  await waitForScreen(page);
  const result = await baseCapture(page, output, name);
  assert.deepEqual(result.metrics.smallTargets, [], `44px: ${name}`);
  return result;
}
export async function requestJoin(page, note = "A curious demo student.") {
  await page.getByRole("button", { name: /^(Request to join|Request again)$/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await dialog.getByLabel("A little introduction (optional)").fill(note);
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Submit membership request", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByText("Membership: pending", { exact: true }).waitFor();
}
export async function roleSwitch(page, base, role) {
  await visit(page, base, "/sign-in?next=%2Fclubs");
  await page.getByLabel("Role (demo switch)", { exact: true }).selectOption(role);
  await page.getByRole("button", { name: "Sign in (demo)", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/clubs");
}
export function trackErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}
