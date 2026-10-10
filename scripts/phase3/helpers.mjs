import assert from "node:assert/strict";
import { join } from "node:path";
import { AxeBuilder, screenMetrics, waitForScreen } from "../audit/browser.mjs";
export async function visit(page, baseUrl, path = "/home") {
  const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200, path);
  await waitForScreen(page);
}
export async function focusIs(page, locator) {
  const element = await locator.elementHandle();
  assert.ok(element, "Focus target must exist");
  await page.waitForFunction((target) => document.activeElement === target, element);
}
export async function closeSearch(page, trigger, key = "Escape") {
  await page.keyboard.press(key);
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  if (trigger) await focusIs(page, trigger);
}
export async function checkTrap(page, dialog, cycles = 12) {
  for (let i = 0; i < cycles; i++) {
    await page.keyboard.press("Tab");
    assert.equal(await dialog.evaluate((node) => node.contains(document.activeElement)), true);
  }
}
export async function capture(page, output, name) {
  const metrics = await page.evaluate(screenMetrics);
  assert.equal(metrics.documentWidth, metrics.viewportWidth, `Overflow: ${name}`);
  assert.deepEqual(metrics.overflowing, [], `Offscreen visible content: ${name}`);
  const violations = (
    await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
  ).violations.map((item) => ({
    id: item.id,
    nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
  }));
  assert.deepEqual(violations, [], `Accessibility: ${name}`);
  await page.screenshot({
    path: join(output, `${name}.png`),
    fullPage: true,
    animations: "disabled",
  });
  return { name, metrics, violations };
}
