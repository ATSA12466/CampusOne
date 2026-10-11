import "./foundation/load-typescript.mjs";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { launchAuditBrowser } from "./audit/browser.mjs";
import {
  authContext,
  visit,
  capture,
  trackErrors,
} from "./phase6/events/helpers.mjs";
const { demoCatalog } = await import("../src/services/demo/catalog.service.ts");
const domain = process.env.AUDIT_DOMAIN ?? "accommodation",
  base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3001",
  out = process.env.AUDIT_OUTPUT_DIR ?? `.cache/phase6/life/${domain}`;
await mkdir(out, { recursive: true });
const rows = (await demoCatalog.list(domain, { pageSize: 30 })).items,
  first = rows.find(
    (i) =>
      i.id ===
      {
        accommodation: "h1",
        marketplace: "mk1",
        opportunities: "o1",
        resources: "r1",
      }[domain],
  ),
  root = domain === "resources" ? "/academics" : `/${domain}`,
  detail = (id) =>
    domain === "resources" ? `/academics/resources/${id}` : `/${domain}/${id}`,
  captures = [];
const browser = await launchAuditBrowser([], { multiProcess: true });
try {
  for (const width of [360, 768, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-${domain}`;
      try {
        await visit(page, base, root);
        assert.equal(
          await page.locator("article[data-discover-key]").count(),
          6,
        );
        captures.push(await capture(page, out, `${key}-directory`));
        await page
          .getByRole("button", {
            name: `Page ${Math.ceil(rows.length / 6)}`,
            exact: true,
          })
          .click();
        assert.equal(
          await page.locator("article[data-discover-key]").count(),
          rows.length % 6 || 6,
        );
        captures.push(await capture(page, out, `${key}-last-page`));
        await page
          .getByRole("searchbox", { name: "Search listings", exact: true })
          .fill("unfindable-campus-item");
        await page
          .getByRole("heading", { name: "No matching listings", exact: true })
          .waitFor();
        captures.push(await capture(page, out, `${key}-empty`));
        await page
          .getByRole("button", { name: "Reset filters", exact: true })
          .click();
        await page.getByRole("radio", { name: "Saved", exact: true }).click();
        assert.equal(
          await page.locator("article[data-discover-key]").count(),
          0,
        );
        for (const row of rows) {
          await visit(page, base, detail(row.id));
          await page
            .getByRole("heading", { name: row.title, exact: true })
            .waitFor();
          captures.push(await capture(page, out, `${key}-${row.id}-detail`));
        }
        await visit(page, base, detail(first.id));
        await page
          .getByRole("button", { name: "Save for later", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Remove from saved", exact: true })
          .waitFor();
        await page.waitForFunction(() => {
          const button = [...document.querySelectorAll("button")].find(
            (b) => b.textContent?.trim() === "Remove from saved",
          );
          return button && !button.disabled;
        });
        await visit(page, base, root + "?view=saved");
        await page.waitForFunction(
          () =>
            document.querySelectorAll("article[data-discover-key]").length ===
            1,
        );
        assert.equal(
          await page.locator("article[data-discover-key]").count(),
          1,
        );
        await page.reload({ waitUntil: "networkidle" });
        await page.waitForFunction(
          () =>
            document.querySelectorAll("article[data-discover-key]").length ===
            1,
        );
        assert.equal(
          await page.locator("article[data-discover-key]").count(),
          1,
        );
        captures.push(await capture(page, out, `${key}-saved-reload`));
        if (width !== 768) {
          await visit(page, base, detail(first.id));
          await page
            .getByRole("button", {
              name: "View photo 1 of 3 in full screen",
              exact: true,
            })
            .click();
          await page.getByRole("dialog").waitFor();
          captures.push(await capture(page, out, `${key}-gallery`));
          await page.keyboard.press("Escape");
          const action = {
            accommodation: "Enquire about this place",
            marketplace: "Ask about this listing",
            opportunities: "Prepare an application",
            resources: "Save study notes",
          }[domain];
          await page.getByRole("button", { name: action, exact: true }).click();
          const dialog = page.getByRole("dialog");
          await dialog.waitFor();
          await dialog
            .getByRole("button", {
              name: "Save local draft / submit to service",
              exact: true,
            })
            .click();
          await dialog
            .getByText("Please add at least 15 characters.", { exact: true })
            .waitFor();
          await dialog
            .getByRole("textbox")
            .fill(
              "A browser-verified private draft for this fictional listing.",
            );
          await dialog.getByRole("combobox").selectOption("yes");
          await dialog
            .getByRole("button", {
              name: "Save local draft / submit to service",
              exact: true,
            })
            .click();
          await dialog.getByText(/Saved on this device only/).waitFor();
          captures.push(await capture(page, out, `${key}-enquiry`));
          await page.keyboard.press("Escape");
        }
        assert.deepEqual(errors, []);
        console.log(
          domain,
          width,
          theme,
          "directory/all details/saved/gallery/validated drafts passed",
        );
      } finally {
        await context.close();
      }
    }
  await writeFile(
    `${out}/checks.json`,
    JSON.stringify(
      { domain, captures, mocked: false, realBackendVerified: false },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
