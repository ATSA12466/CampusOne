import assert from "node:assert/strict";
import { AxeBuilder, restrictToApp, waitForScreen } from "../audit/browser.mjs";

async function trapped(page, dialog) {
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press(index % 2 ? "Shift+Tab" : "Tab");
    assert.equal(
      await dialog.evaluate((element) => element.contains(document.activeElement)),
      true,
    );
  }
}
export async function checkInteractions(browser, baseUrl, output) {
  const context = await browser.newContext({
    viewport: { width: 360, height: 900 },
    reducedMotion: "reduce",
  });
  await restrictToApp(context, baseUrl);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/design`, { waitUntil: "networkidle" });
  await waitForScreen(page);
  const trigger = page.getByRole("button", { name: "Open dialog", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Save your next chapter", exact: true });
  await dialog.waitFor();
  await trapped(page, dialog);
  const dialogAxe = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
    .violations;
  assert.deepEqual(
    dialogAxe.map((v) => v.id),
    [],
  );
  await page.screenshot({ path: `${output}/dialog-360.png`, animations: "disabled" });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.equal(await trigger.evaluate((element) => document.activeElement === element), true);
  const sheetTrigger = page.getByRole("button", { name: "Open sheet", exact: true });
  await sheetTrigger.click();
  const sheet = page.getByRole("dialog", { name: "A little more campus", exact: true });
  await sheet.waitFor();
  await trapped(page, sheet);
  await page.keyboard.press("Escape");
  await sheet.waitFor({ state: "hidden" });
  assert.equal(await sheetTrigger.evaluate((element) => document.activeElement === element), true);
  await page.getByRole("button", { name: "Open preview action menu", exact: true }).click();
  await page.getByRole("menuitem", { name: "Save preview", exact: true }).click();
  await page.getByText("Preview saved", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Dismiss notification", exact: true }).last().click();
  const tabs = page.getByRole("tablist", { name: "Club preview sections", exact: true });
  await tabs.getByRole("tab", { name: "Overview", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await page
    .getByText("Friday code circles. Saturday project sessions.", { exact: true })
    .waitFor();
  const choice = page.getByRole("checkbox", { name: "Keep this resource saved", exact: true });
  await choice.uncheck();
  assert.equal(await choice.getAttribute("aria-checked"), "false");
  const notifications = page.getByRole("switch", { name: "Campus notifications", exact: true });
  await notifications.click();
  assert.equal(await notifications.getAttribute("aria-checked"), "false");
  await page.getByRole("radio", { name: "Only me", exact: true }).click();
  assert.equal(
    await page.getByRole("radio", { name: "Only me", exact: true }).getAttribute("aria-checked"),
    "true",
  );
  await page.getByRole("button", { name: "Page 8", exact: true }).click();
  await page.getByText("Page 8 of 8", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Load more", exact: true }).click();
  await page.getByText("An event to remember", { exact: true }).waitFor();
  const gallery = page.getByRole("region", { name: "Campus life gallery", exact: true });
  await gallery.focus();
  await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "View photo 2 of 3 in full screen", exact: true }).click();
  const lightbox = page.getByRole("dialog", { name: "Campus life gallery", exact: true });
  await lightbox.waitFor();
  await page.keyboard.press("ArrowRight");
  await lightbox.getByText("Photo 3 of 3", { exact: true }).waitFor();
  await trapped(page, lightbox);
  await page.keyboard.press("Escape");
  await lightbox.waitFor({ state: "hidden" });
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("aria-label") === "View photo 2 of 3 in full screen",
  );
  assert.equal(
    await page
      .getByRole("button", { name: "View photo 2 of 3 in full screen", exact: true })
      .evaluate((element) => document.activeElement === element),
    true,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  const motion = await page
    .locator(".skeleton-sheen")
    .first()
    .evaluate((element) => getComputedStyle(element).animationDuration);
  assert.equal(motion, "1e-05s");
  assert.deepEqual(errors, []);
  await context.close();
  return {
    dialogFocusTrap: true,
    sheetFocusTrap: true,
    escapeAndFocusReturn: true,
    dialogAxeViolations: 0,
    dropdownToast: true,
    tabsArrowKeys: true,
    checkboxSwitchRadio: true,
    paginationLoadMore: true,
    galleryArrowKeysAndFocusReturn: true,
    reducedMotion: true,
    exceptions: 0,
  };
}
