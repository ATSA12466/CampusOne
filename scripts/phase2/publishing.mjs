import assert from "node:assert/strict";
import { restrictToApp, waitForScreen, seedOnboarding } from "../audit/browser.mjs";

export async function checkPublishing(browser, production) {
  const context = await browser.newContext({ viewport: { width: 360, height: 900 } });
  // Publishing metadata/font checks target a returning student detail route,
  // not the first-visit tour now correctly enforced by the client guard.
  await seedOnboarding(context);
  await restrictToApp(context, production);
  const page = await context.newPage();
  await page.goto(`${production}/accommodation/h1`, { waitUntil: "networkidle" });
  await waitForScreen(page);
  assert.ok((await page.title()).endsWith(" | CampusOne"));
  assert.ok((await page.locator('meta[name="description"]').getAttribute("content")).length > 20);
  assert.equal(
    await page.locator('meta[property="og:title"]').getAttribute("content"),
    await page.title(),
  );
  assert.ok(await page.locator('meta[property="og:description"]').getAttribute("content"));
  const price = page.getByText(/GH₵/).first();
  await price.evaluate((element) => {
    element.dataset.fontCheck = "cedi";
  });
  const session = await context.newCDPSession(page);
  await session.send("DOM.enable");
  await session.send("CSS.enable");
  const { root } = await session.send("DOM.getDocument");
  const { nodeId } = await session.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: '[data-font-check="cedi"]',
  });
  const { fonts } = await session.send("CSS.getPlatformFontsForNode", { nodeId });
  assert.ok(fonts.length);
  assert.ok(fonts.every((font) => font.isCustomFont && font.familyName.startsWith("Manrope")));
  const faces = await page.evaluate(() =>
    Array.from(document.fonts)
      .filter((face) => face.status === "loaded")
      .map((face) => face.family),
  );
  assert.ok(faces.some((family) => family.toLowerCase().includes("extended")));
  await context.close();

  const staticContext = await browser.newContext({ colorScheme: "light" });
  await restrictToApp(staticContext, production);
  await staticContext.addInitScript(() => {
    localStorage.setItem("campusone-theme", "dark");
    window.themePaintProof = null;
    new PerformanceObserver((list) => {
      if (list.getEntries().some((entry) => entry.name === "first-paint")) {
        window.themePaintProof = {
          theme: document.documentElement.dataset.theme,
          background: getComputedStyle(document.body).backgroundColor,
          native: document.documentElement.style.colorScheme,
        };
      }
    }).observe({ type: "paint", buffered: true });
  });
  // Block hydration chunks: only the inline bootstrap may establish first-paint appearance.
  await staticContext.route("**/_next/**/*.js", (route) => route.abort());
  const staticPage = await staticContext.newPage();
  await staticPage.goto(`${production}/home`, { waitUntil: "networkidle" });
  await staticPage.waitForFunction(() => window.themePaintProof);
  const paint = await staticPage.evaluate(() => window.themePaintProof);
  assert.deepEqual(paint, { theme: "dark", background: "rgb(11, 21, 35)", native: "dark" });
  await staticContext.close();
  return {
    detailMetadata: true,
    cediUsesManrope: true,
    platformFonts: fonts,
    firstPaintWithoutHydration: paint,
  };
}
