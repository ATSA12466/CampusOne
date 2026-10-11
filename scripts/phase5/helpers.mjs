import assert from "node:assert/strict";
import { restrictToApp, waitForScreen } from "../audit/browser.mjs";
import { capture as aaCapture } from "../phase3/helpers.mjs";
export { focusIs, checkTrap, visit } from "../phase3/helpers.mjs";
export async function authContext(
  browser,
  base,
  width = 360,
  colorScheme = "light",
  completed = true,
) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    colorScheme,
    reducedMotion: "reduce",
  });
  if (completed)
    await context.addInitScript(() => {
      if (!localStorage.getItem("campusone-onboarding"))
        localStorage.setItem(
          "campusone-onboarding",
          JSON.stringify({ state: { completed: true }, version: 0 }),
        );
    });
  await restrictToApp(context, base);
  return context;
}
export async function capture(page, output, name) {
  await waitForScreen(page);
  if (await page.locator(".auth-photo-story").count()) {
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll(".auth-photo-story img")).every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    );
    const photo = await page.locator(".auth-photo-story").evaluate((el) => {
      const frame = el.getBoundingClientRect(),
        image = el.querySelector("img").getBoundingClientRect(),
        copy = el.querySelector(".auth-story-content").getBoundingClientRect();
      return {
        position: getComputedStyle(el.querySelector("img").parentElement).position,
        frame: frame.toJSON(),
        image: image.toJSON(),
        copy: copy.toJSON(),
      };
    });
    assert.equal(photo.position, "absolute", `Photo must be an overlay, not stacked: ${name}`);
    for (const edge of ["left", "right", "top", "bottom"])
      assert.ok(
        Math.abs(photo.frame[edge] - photo.image[edge]) < 2,
        `Photo fills story: ${name} ${edge}`,
      );
    assert.ok(
      photo.copy.top >= photo.frame.top - 1 && photo.copy.bottom <= photo.frame.bottom + 1,
      `Copy stays on photo: ${name}`,
    );
    if (page.viewportSize().width >= 1024)
      assert.ok(photo.frame.height <= 900, `Desktop photo stays within one viewport: ${name}`);
  }
  const result = await aaCapture(page, output, name);
  assert.deepEqual(result.metrics.smallTargets, [], `44px targets: ${name}`);
  return result;
}
export async function stored(page, key = "campusone-auth") {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null")?.state ?? null,
    key,
  );
}
export async function noSecrets(page, secrets) {
  const state = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((key) => key.startsWith("campusone-"))
      .map((key) => localStorage.getItem(key))
      .join("\n"),
  );
  for (const secret of secrets)
    assert.ok(!state.includes(secret), `Secret/file cannot be persisted: ${secret}`);
}
export async function completeSignup(page, name = "Esi Owusu", email = "esi.owusu@campusone.demo") {
  await page.getByLabel(/^Full name/).fill(name);
  await page.getByLabel(/^Email/).fill(email);
  await page.getByLabel(/^Password/).fill("preview-password");
  await page.getByLabel(/^Confirm password/).fill("preview-password");
  await page.getByRole("checkbox", { name: "I understand the preview notice" }).check();
}
export async function stepIs(page, index) {
  await page.waitForFunction(
    (index) =>
      document
        .querySelector('[aria-label="Onboarding progress"]')
        ?.getAttribute("aria-valuenow") === String(index),
    index,
  );
}
