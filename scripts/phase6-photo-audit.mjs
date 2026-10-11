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
  domain = process.env.AUDIT_DOMAIN ?? "marketplace",
  root = domain === "reports" ? "/lost-and-found" : "/marketplace",
  out = process.env.AUDIT_OUTPUT_DIR ?? `.cache/phase6/life/${domain}-photos`;
await mkdir(out, { recursive: true });
const browser = await launchAuditBrowser([], { multiProcess: true }),
  captures = [];
try {
  for (const width of [360, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-${domain}`;
      try {
        await visit(page, base, root);
        await page
          .getByRole("button", {
            name: domain === "reports" ? "Create report" : "Create listing",
            exact: true,
          })
          .click();
        const dialog = page.getByRole("dialog");
        await dialog
          .getByLabel("Item name", { exact: true })
          .fill("Photo persistence test");
        await dialog
          .getByLabel("Description", { exact: true })
          .fill(
            "A browser test of a required, cropped and persisted local photo record.",
          );
        await dialog
          .getByLabel(
            domain === "reports"
              ? "Last seen / found location"
              : "Collection area",
            { exact: true },
          )
          .fill("Campus library entrance");
        await dialog
          .getByRole("button", {
            name: domain === "reports" ? "Submit photo report" : "Save listing",
            exact: true,
          })
          .click();
        await dialog
          .getByText("Prepare the required photo before submitting.", {
            exact: true,
          })
          .waitFor();
        captures.push(await capture(page, out, `${key}-photo-required`));
        await dialog
          .locator("input[type=file]")
          .setInputFiles("public/images/demo/housing-room.webp");
        await dialog
          .getByRole("button", { name: "Use this photo", exact: true })
          .click();
        await dialog
          .getByText("Prepared photo attached.", { exact: true })
          .waitFor();
        await dialog
          .getByRole("button", {
            name: domain === "reports" ? "Submit photo report" : "Save listing",
            exact: true,
          })
          .click();
        await page
          .getByRole("heading", { name: "Photo persistence test", exact: true })
          .waitFor();
        await page.reload({ waitUntil: "networkidle" });
        await page
          .getByRole("heading", { name: "Photo persistence test", exact: true })
          .waitFor();
        captures.push(await capture(page, out, `${key}-photo-reload`));
        const card = page
          .locator("article")
          .filter({
            has: page.getByRole("heading", {
              name: "Photo persistence test",
              exact: true,
            }),
          });
        await card.getByRole("button", { name: "Edit", exact: true }).click();
        await page
          .getByRole("dialog")
          .getByLabel("Item name", { exact: true })
          .fill("Edited photo record");
        await page
          .getByRole("dialog")
          .getByRole("button", {
            name: domain === "reports" ? "Submit photo report" : "Save listing",
            exact: true,
          })
          .click();
        await page
          .getByRole("heading", { name: "Edited photo record", exact: true })
          .waitFor();
        const edited = page
          .locator("article")
          .filter({
            has: page.getByRole("heading", {
              name: "Edited photo record",
              exact: true,
            }),
          });
        await edited
          .getByRole("button", { name: "Mark closed", exact: true })
          .click();
        await edited
          .getByRole("button", { name: "Reopen", exact: true })
          .waitFor();
        captures.push(await capture(page, out, `${key}-edited-closed`));
        page.once("dialog", (d) => d.accept());
        await edited
          .getByRole("button", { name: "Delete", exact: true })
          .click();
        await page
          .getByRole("heading", { name: "Edited photo record", exact: true })
          .waitFor({ state: "detached" });
        assert.deepEqual(errors, []);
        console.log(
          domain,
          width,
          theme,
          "required photo/crop/persist/edit/close/delete passed",
        );
      } finally {
        await context.close();
      }
    }
  await writeFile(
    `${out}/checks.json`,
    JSON.stringify({ captures, realUploadVerified: false }, null, 2),
  );
} finally {
  await browser.close();
}
