import assert from "node:assert/strict";
import { restrictToApp } from "../audit/browser.mjs";
import { capture, closeSearch, focusIs, visit } from "./helpers.mjs";
export async function checkSearchStates(browser, baseUrl, output) {
  const cases = [];
  for (const colorScheme of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport: { width: 360, height: 900 },
      colorScheme,
      reducedMotion: "reduce",
    });
    await restrictToApp(context, baseUrl);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await visit(page, baseUrl, "/design");
      for (const [mode, label] of [
        ["error", "Preview search error"],
        ["partial", "Preview partial results"],
      ]) {
        const trigger = page.getByRole("button", { name: label, exact: true });
        await trigger.click();
        const dialog = page.getByRole("dialog", { name: "Search campus", exact: true });
        await dialog.waitFor();
        await dialog.getByRole("alert").waitFor();
        cases.push(await capture(page, output, `360-${colorScheme}-${mode}`));
        await dialog.getByRole("button", { name: "Try again", exact: true }).click();
        await dialog.getByRole("alert").waitFor({ state: "hidden" });
        await dialog.getByRole("listbox").getByRole("option").first().waitFor();
        assert.equal(await dialog.getByRole("listbox").getByRole("option").count(), 18);
        await closeSearch(page, trigger);
      }
      const slow = page.getByRole("button", { name: "Preview slow search", exact: true });
      await slow.click();
      const dialog = page.getByRole("dialog", { name: "Search campus", exact: true });
      const input = dialog.getByRole("combobox", { name: "Search campus content", exact: true });
      await dialog.getByRole("listbox").getByRole("option").first().waitFor();
      await input.fill("Code");
      await dialog.getByRole("status").filter({ hasText: "Searching…" }).waitFor();
      await input.press("Enter");
      assert.equal(new URL(page.url()).pathname, "/design");
      await dialog.waitFor();
      cases.push(await capture(page, output, `360-${colorScheme}-loading`));
      await input.fill("Innovation");
      await dialog.getByRole("option", { name: "Innovation Night, Events", exact: true }).waitFor();
      await page.waitForTimeout(3100); // Controlled 3000ms uncooperative fixture, not a readiness poll.
      assert.equal(
        await dialog.getByRole("option", { name: "Code Collective, Clubs", exact: true }).count(),
        0,
      );
      assert.equal(await input.inputValue(), "Innovation");
      await focusIs(page, input);
      await closeSearch(page, slow);
      await slow.click();
      await input.waitFor();
      await input.fill("Code");
      await page.waitForTimeout(300); // Let the 225ms debounce start the in-flight fixture.
      await closeSearch(page, slow);
      await page.waitForTimeout(3100);
      assert.equal(await page.getByRole("dialog").count(), 0);
      assert.deepEqual(errors, []);
      console.log(`Search failure/loading fixtures ${colorScheme} passed`);
    } finally {
      await context.close();
    }
  }
  return {
    captures: cases,
    errorRetry: true,
    partialFailureRetry: true,
    loadingBlocksEnter: true,
    staleRepliesIgnored: true,
    closeCancels: true,
    realApiVerified: false,
  };
}
