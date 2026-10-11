import assert from "node:assert/strict";
import { authContext, capture, checkTrap, focusIs, noSecrets, stepIs } from "./helpers.mjs";
export async function checkPhoto(browser, base, output) {
  const cases = [];
  for (const width of [360, 768, 1280])
    for (const scheme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, scheme, false),
        page = await context.newPage(),
        errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const shots = [],
        prefix = `${width}-${scheme}`;
      try {
        await page.goto(`${base}/onboarding`, { waitUntil: "networkidle" });
        for (let index = 1; index < 5; index++) {
          await page.getByRole("button", { name: "Continue", exact: true }).click();
          await stepIs(page, index + 1);
        }
        const trigger = page.getByRole("button", { name: "Add your own photo", exact: true });
        await trigger.click();
        const dialog = page.getByRole("dialog", {
          name: "Your photo, for this visit",
          exact: true,
        });
        await dialog.waitFor();
        shots.push(await capture(page, output, `${prefix}-photo-dialog`));
        await checkTrap(page, dialog, 8);
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden" });
        await focusIs(page, trigger);
        await trigger.click();
        await dialog.waitFor();
        await dialog.locator('input[type="file"]').setInputFiles({
          name: "not-a-photo.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("not a photo"),
        });
        await dialog.getByRole("alert").waitFor();
        shots.push(await capture(page, output, `${prefix}-photo-error`));
        await dialog
          .locator('input[type="file"]')
          .setInputFiles("public/images/demo/clubs-hero.webp");
        await dialog
          .getByRole("button", { name: "Use photo for this visit", exact: true })
          .waitFor();
        shots.push(await capture(page, output, `${prefix}-photo-crop`));
        await dialog.getByRole("button", { name: "Use photo for this visit", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
        await focusIs(page, trigger);
        assert.equal(
          await page
            .getByRole("radio", { name: "Your local photo", exact: true })
            .getAttribute("aria-checked"),
          "true",
        );
        const photo = await page
          .getByRole("radio", { name: "Your local photo", exact: true })
          .locator("img")
          .getAttribute("src");
        assert.ok(photo.startsWith("blob:"));
        shots.push(await capture(page, output, `${prefix}-photo-prepared`));
        await noSecrets(page, ["blob:", "base64,", "originalBytes"]);
        await page.getByRole("button", { name: "Finish and continue", exact: true }).click();
        await page.waitForURL((url) => url.pathname === "/home");
        const avatar = page.locator('header a[title="Your profile"] img');
        await avatar.waitFor();
        assert.ok((await avatar.getAttribute("src")).startsWith("blob:"));
        await page.reload({ waitUntil: "networkidle" });
        assert.equal(new URL(page.url()).pathname, "/home");
        assert.equal(
          await page.locator('header a[title="Your profile"] img[src^="blob:"]').count(),
          0,
        );
        assert.deepEqual(errors, []);
        cases.push({
          width,
          scheme,
          optionalEditor: true,
          invalidFileRejected: true,
          localCropPrepared: true,
          keyboardTrapEscapeReturn: true,
          avatarSurvivedNavigation: true,
          blobNotPersisted: true,
          reloadDroppedVisitPhoto: true,
          screenshots: shots,
        });
      } finally {
        await context.close();
      }
    }
  return cases;
}
