import assert from "node:assert/strict";
import { restrictToApp, waitForScreen } from "../audit/browser.mjs";
export async function checkThemes(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 768, height: 900 },
    colorScheme: "light",
  });
  await restrictToApp(context, baseUrl);
  const page = await context.newPage();
  await page.goto(`${baseUrl}/design`, { waitUntil: "networkidle" });
  await waitForScreen(page);
  await page.getByRole("radio", { name: "Dark", exact: true }).click();
  await page.waitForFunction(() => localStorage.getItem("campusone-theme") === "dark");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  const second = await context.newPage();
  await second.goto(`${baseUrl}/design`, { waitUntil: "networkidle" });
  await waitForScreen(second);
  await second.getByRole("radio", { name: "Light", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === "light");
  await page.getByRole("radio", { name: "System", exact: true }).click();
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await page.waitForFunction(() => document.documentElement.dataset.theme === "light");
  await context.close();
  const denied = await browser.newContext({
    colorScheme: "dark",
    viewport: { width: 360, height: 900 },
  });
  await denied.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("private mode");
    };
    Storage.prototype.setItem = () => {
      throw new Error("private mode");
    };
  });
  const privatePage = await denied.newPage();
  await privatePage.goto(`${baseUrl}/design`, { waitUntil: "networkidle" });
  await waitForScreen(privatePage);
  assert.equal(await privatePage.locator("html").getAttribute("data-theme"), "dark");
  await privatePage.getByRole("radio", { name: "Light", exact: true }).click();
  await privatePage.waitForFunction(() => document.documentElement.dataset.theme === "light");
  await denied.close();
  return {
    persistsOnReload: true,
    syncsAcrossTabs: true,
    followsSystemChanges: true,
    privateModeFallback: true,
  };
}
