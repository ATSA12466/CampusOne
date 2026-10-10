import assert from "node:assert/strict";
import { restrictToApp, waitForScreen } from "../audit/browser.mjs";

export async function checkTouch(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 360, height: 900 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  await restrictToApp(context, baseUrl);
  const page = await context.newPage();
  await page.goto(`${baseUrl}/design`, { waitUntil: "networkidle" });
  await waitForScreen(page);
  const gallery = page.getByRole("region", { name: "Campus life gallery", exact: true });
  await gallery.scrollIntoViewIfNeeded();
  const box = await gallery.boundingBox();
  assert.ok(box);
  const session = await context.newCDPSession(page);
  const y = box.y + Math.min(box.height / 2, 100);
  const x = box.x + box.width * 0.85;
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 8; step++) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x - (box.width * 0.75 * step) / 8, y }],
    });
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.getByText("Slide 2 of 3", { exact: true }).waitFor();
  await context.close();
  return { nativeSwipe: true, snappedToSecondPhoto: true };
}
