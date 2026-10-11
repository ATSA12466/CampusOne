import assert from "node:assert/strict";
import {
  authContext,
  visit,
  capture,
  stored,
  trackErrors,
} from "./helpers.mjs";
export async function resilienceChecks(browser, base, output) {
  const captures = [];
  for (const width of [360, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-resilience`;
      try {
        await visit(page, base, "/discover?category=accommodation&view=all");
        await page.evaluate(() => {
          const original = Storage.prototype.setItem;
          Storage.prototype.setItem = function (key, value) {
            if (key === "campusone-app")
              throw new DOMException("Blocked", "SecurityError");
            return original.call(this, key, value);
          };
        });
        await page
          .getByRole("button", { name: "Save BlueNest Residence", exact: true })
          .click();
        await page
          .getByRole("button", {
            name: "Unsave BlueNest Residence",
            exact: true,
          })
          .waitFor();
        await page
          .getByText("For this visit only. Device storage is unavailable.", {
            exact: true,
          })
          .waitFor();
        assert.equal(
          (await stored(page, "campusone-app"))?.bookmarks?.length ?? 0,
          0,
        );
        captures.push(await capture(page, output, `${key}-visit-only`));
        await page.reload({ waitUntil: "networkidle" });
        await page
          .getByRole("button", { name: "Save BlueNest Residence", exact: true })
          .waitFor();
        await context.route("**/_next/image?*", (route) =>
          route.request().url().includes("campus-life.webp")
            ? route.abort("failed")
            : route.continue(),
        );
        await page.reload({ waitUntil: "networkidle" });
        await page
          .getByText("Photo coming soon", { exact: true })
          .first()
          .waitFor();
        const hero = await page.locator(".discover-hero").boundingBox();
        assert.ok(hero.height >= 448);
        captures.push(await capture(page, output, `${key}-photo-fallback`));
        assert.deepEqual(errors, []);
        console.log(
          "Discover verified memory-only save/reload and reserved-ratio photo fallback",
          width,
          theme,
          "passed",
        );
      } finally {
        await context.close();
      }
    }
  return {
    captures,
    verifiedVisitOnly: true,
    noFakePersistence: true,
    reservedPhotoFallback: true,
  };
}
