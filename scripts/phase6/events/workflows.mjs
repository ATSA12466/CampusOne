import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import sharp from "sharp";
import { resolve, join } from "node:path";
import {
  authContext,
  visit,
  capture,
  stored,
  focusIs,
  checkTrap,
  trackErrors,
} from "./helpers.mjs";
const require = createRequire(
  join(resolve(process.env.AUDIT_TOOLING_DIR ?? ".cache/design-audit/tooling"), "package.json"),
);
export async function workflowChecks(browser, base, output) {
  const captures = [];
  for (const width of [360, 768, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-workflow`;
      try {
        await context.addInitScript(() => {
          window.__calendarRevokes = [];
          const original = URL.revokeObjectURL;
          URL.revokeObjectURL = function (url) {
            window.__calendarRevokes.push(url);
            return original.call(URL, url);
          };
        });
        await visit(page, base, "/events/e1");
        const trigger = page.getByRole("button", { name: "RSVP", exact: true });
        await trigger.click();
        const dialog = page.getByRole("dialog"),
          checkbox = dialog.getByRole("checkbox");
        await dialog.getByRole("button", { name: "Confirm demo RSVP", exact: true }).click();
        await dialog
          .getByText("Please acknowledge where this RSVP will be saved.", { exact: true })
          .waitFor();
        await focusIs(page, checkbox);
        await checkTrap(page, dialog, 8);
        captures.push(await capture(page, output, `${key}-consent-error`));
        await checkbox.check();
        await dialog.getByRole("button", { name: "Confirm demo RSVP", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
        await page.getByRole("button", { name: "Demo ticket", exact: true }).waitFor();
        await focusIs(page, page.locator(".event-detail-actions"));
        assert.deepEqual((await stored(page, "campusone-app")).registrations, ["e1"]);
        await page.getByRole("button", { name: "Save Innovation Night", exact: true }).click();
        await page.getByRole("button", { name: "Unsave Innovation Night", exact: true }).waitFor();
        captures.push(await capture(page, output, `${key}-going`));
        await page.getByRole("button", { name: "Demo ticket", exact: true }).click();
        await dialog.getByText("DEMO ONLY · NOT VALID FOR ENTRY", { exact: true }).waitFor();
        const qr = dialog.getByRole("img", {
          name: "Demonstration QR — not valid for entry",
          exact: true,
        });
        await qr.waitFor();
        captures.push(await capture(page, output, `${key}-ticket`));
        const png = await qr.screenshot(),
          { data, info } = await sharp(png)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true }),
          decoded = require("jsqr")(new Uint8ClampedArray(data), info.width, info.height);
        assert.equal(decoded?.data, "CAMPUSONE_DEMO_NOT_VALID_FOR_ENTRY|e1");
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden" });
        await focusIs(page, page.getByRole("button", { name: "Demo ticket", exact: true }));
        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: "Add to calendar", exact: true }).click();
        const download = await downloadPromise,
          content = await readFile(await download.path(), "utf8");
        assert.equal(download.suggestedFilename(), "campusone-demo-e1.ics");
        assert.match(content, /DTSTART:20261016T180000Z/);
        assert.match(content, /SUMMARY:DEMO: Innovation Night/);
        await writeFile(`${output}/${key}.ics`, content);
        await page.waitForFunction(() => window.__calendarRevokes.length > 0);
        await page.reload({ waitUntil: "networkidle" });
        await page.getByRole("button", { name: "Demo ticket", exact: true }).waitFor();
        await page.getByRole("button", { name: "Unsave Innovation Night", exact: true }).waitFor();
        await visit(page, base, "/events");
        await page.getByRole("button", { name: "My RSVPs", exact: true }).click();
        assert.equal(await page.locator("article[aria-label]").count(), 1);
        captures.push(await capture(page, output, `${key}-my-rsvp`));
        await page.getByRole("button", { name: "Saved events", exact: true }).click();
        assert.equal(await page.locator("article[aria-label]").count(), 1);
        await page.getByRole("button", { name: "Unsave Innovation Night", exact: true }).click();
        await page.getByText("A little space for good plans.", { exact: true }).waitFor();
        await visit(page, base, "/events/e1");
        await page.getByRole("button", { name: "Cancel RSVP", exact: true }).click();
        captures.push(await capture(page, output, `${key}-cancel-confirm`));
        await dialog.getByRole("button", { name: "Keep my RSVP", exact: true }).click();
        assert.ok((await stored(page, "campusone-app")).registrations.includes("e1"));
        await page.getByRole("button", { name: "Cancel RSVP", exact: true }).click();
        await dialog.getByRole("button", { name: "Cancel RSVP", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
        await page.getByRole("button", { name: "RSVP", exact: true }).waitFor();
        await focusIs(page, page.locator(".event-detail-actions"));
        assert.deepEqual((await stored(page, "campusone-app")).registrations, []);
        assert.equal(
          await page.getByRole("button", { name: "Demo ticket", exact: true }).count(),
          0,
        );
        await page
          .getByRole("button", { name: "View photo 1 of 1 in full screen", exact: true })
          .click();
        captures.push(await capture(page, output, `${key}-gallery`));
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden" });
        assert.deepEqual(errors, []);
        console.log("Event RSVP/save/cancel/ticket/ICS/gallery", width, theme, "passed");
      } finally {
        await context.close();
      }
    }
  return {
    captures,
    qrDecoded: true,
    noPersonalDataInDemoQr: true,
    icsDownloaded: true,
    objectUrlRevoked: true,
    persistence: true,
    consentAndFocus: true,
  };
}
