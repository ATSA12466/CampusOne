import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { launchAuditBrowser } from "./audit/browser.mjs";
import {
  authContext,
  visit,
  capture,
  trackErrors,
} from "./phase6/events/helpers.mjs";
const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3001",
  out = process.env.AUDIT_OUTPUT_DIR ?? ".cache/phase6/life/lost-found";
await mkdir(out, { recursive: true });
const browser = await launchAuditBrowser([], { multiProcess: true }),
  captures = [];
try {
  for (const width of [360, 768, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-reports`;
      try {
        await visit(page, base, "/lost-and-found");
        assert.equal(await page.locator("article[data-report-id]").count(), 6);
        captures.push(await capture(page, out, `${key}-directory`));
        const seen = [];
        for (const n of [1, 2]) {
          if (n === 2)
            await page
              .getByRole("button", { name: "Page 2", exact: true })
              .click();
          const cards = page.locator("article[data-report-id]");
          seen.push(
            ...(await cards.evaluateAll((nodes) =>
              nodes.map((n) => n.dataset.reportId),
            )),
          );
          for (let i = 0; i < 6; i++) {
            const card = cards.nth(i),
              id = await card.getAttribute("data-report-id");
            await card
              .getByRole("button", { name: "View report", exact: true })
              .click();
            await page.getByRole("dialog").waitFor();
            captures.push(await capture(page, out, `${key}-${id}-sheet`));
            await page.keyboard.press("Escape");
          }
        }
        assert.equal(new Set(seen).size, 12);
        await page
          .getByRole("searchbox", { name: "Search reports", exact: true })
          .fill("unfindable");
        await page
          .getByRole("heading", { name: "No matching reports", exact: true })
          .waitFor();
        captures.push(await capture(page, out, `${key}-empty`));
        await page
          .getByRole("searchbox", { name: "Search reports", exact: true })
          .fill("Black HP laptop sleeve");
        await page
          .getByRole("button", {
            name: "Save Black HP laptop sleeve",
            exact: true,
          })
          .click();
        await page
          .getByRole("button", {
            name: "Unsave Black HP laptop sleeve",
            exact: true,
          })
          .waitFor();
        await page.waitForFunction(() => {
          const button = document.querySelector(
            'button[aria-label="Unsave Black HP laptop sleeve"]',
          );
          return button && !button.disabled;
        });
        await page
          .getByRole("combobox", { name: "Report view", exact: true })
          .selectOption("saved");
        await page.waitForFunction(
          () =>
            document.querySelectorAll("article[data-report-id]").length === 1,
        );
        assert.equal(await page.locator("article[data-report-id]").count(), 1);
        await page.reload({ waitUntil: "networkidle" });
        await page
          .getByRole("combobox", { name: "Report view", exact: true })
          .selectOption("saved");
        await page.waitForFunction(
          () =>
            document.querySelectorAll("article[data-report-id]").length === 1,
        );
        assert.equal(await page.locator("article[data-report-id]").count(), 1);
        captures.push(await capture(page, out, `${key}-saved-reload`));
        assert.deepEqual(errors, []);
        console.log(
          width,
          theme,
          "12 report sheets/filters/pages/canonical saves passed",
        );
      } finally {
        await context.close();
      }
    }
  await writeFile(`${out}/checks.json`, JSON.stringify({ captures }, null, 2));
} finally {
  await browser.close();
}
