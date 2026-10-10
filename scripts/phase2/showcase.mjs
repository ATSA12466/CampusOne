import assert from "node:assert/strict";
import { AxeBuilder, restrictToApp, waitForScreen } from "../audit/browser.mjs";

export async function captureShowcase(browser, baseUrl, output) {
  const result = [];
  for (const width of [360, 768, 1280])
    for (const colorScheme of ["light", "dark"]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        colorScheme,
        reducedMotion: "reduce",
      });
      await restrictToApp(context, baseUrl);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const response = await page.goto(`${baseUrl}/design`, { waitUntil: "networkidle" });
      await waitForScreen(page);
      // Assert hydration, rather than relying on a server-rendered screenshot alone.
      await page
        .getByRole("radio", { name: colorScheme === "dark" ? "Dark" : "Light", exact: true })
        .click();
      await page.waitForFunction(
        (mode) => document.documentElement.dataset.themePreference === mode,
        colorScheme,
      );
      await page.getByRole("radio", { name: "System", exact: true }).click();
      await page.waitForFunction(
        () => document.documentElement.dataset.themePreference === "system",
      );
      await page
        .locator("img")
        .evaluateAll((images) => images.forEach((image) => (image.loading = "eager")));
      await page.waitForFunction(
        () =>
          ![...document.querySelectorAll("img")].some(
            (image) => image.alt === "Demonstration of an unavailable campus photograph.",
          ),
      );
      await page.waitForFunction(() =>
        [...document.querySelectorAll("main img")].every(
          (image) => image.complete && image.naturalWidth > 0,
        ),
      );
      const violations = (
        await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
      ).violations;
      const geometry = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        theme: document.documentElement.dataset.theme,
      }));
      assert.equal(response.status(), 200);
      assert.equal(geometry.width, width);
      assert.equal(geometry.theme, colorScheme);
      assert.deepEqual(errors, []);
      assert.deepEqual(
        violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
        [],
      );
      await page.evaluate(() => window.scrollTo(0, 0));
      const screenshot = `design-${width}-${colorScheme}.png`;
      await page.screenshot({
        path: `${output}/${screenshot}`,
        fullPage: true,
        animations: "disabled",
      });
      for (const section of ["media", "controls", "navigation", "data", "states", "uploads"])
        await page.locator(`#${section}`).screenshot({
          path: `${output}/design-${width}-${colorScheme}-${section}.png`,
          animations: "disabled",
          style: "header { visibility: hidden !important; }",
        });
      result.push({
        width,
        colorScheme,
        status: 200,
        exceptions: 0,
        axeViolations: 0,
        documentWidth: geometry.width,
        screenshot,
      });
      console.log(`Showcase ${width} ${colorScheme}: hydrated, images loaded, axe 0`);
      await context.close();
    }
  return result;
}
