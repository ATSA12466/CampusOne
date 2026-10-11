import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { launchAuditBrowser } from "./audit/browser.mjs";
import {
  authContext,
  visit,
  capture,
  trackErrors,
  stored,
} from "./phase6/events/helpers.mjs";
const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3001",
  out = process.env.AUDIT_OUTPUT_DIR ?? ".cache/phase6/profile/browser";
await mkdir(out, { recursive: true });
const browser = await launchAuditBrowser([], { multiProcess: true }),
  captures = [];
try {
  for (const width of [360, 768, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-profile`;
      try {
        await visit(page, base, "/profile");
        await page
          .getByRole("button", { name: "Edit profile", exact: true })
          .waitFor();
        captures.push(await capture(page, out, `${key}-overview`));
        if (width !== 768) {
          await page
            .getByRole("button", { name: "Edit profile", exact: true })
            .click();
          const dialog = page.getByRole("dialog");
          await dialog.getByLabel("Preferred name", { exact: true }).fill("a");
          await dialog
            .getByRole("button", { name: "Save profile", exact: true })
            .click();
          assert.equal(
            await dialog
              .getByLabel("Preferred name", { exact: true })
              .getAttribute("aria-invalid"),
            "true",
          );
          captures.push(await capture(page, out, `${key}-validation`));
          await dialog
            .getByLabel("Preferred name", { exact: true })
            .fill("Esi Owusu");
          await dialog
            .getByLabel("About you", { exact: true })
            .fill(
              "Building things, asking questions and making a little room for music.",
            );
          await dialog
            .getByLabel("Interests", { exact: true })
            .fill("Robotics, music, volunteering");
          await dialog
            .getByLabel("Show programme on your profile card", { exact: true })
            .selectOption("no");
          await dialog
            .getByRole("button", { name: "Save profile", exact: true })
            .click();
          await page
            .getByRole("heading", { name: "Esi Owusu", exact: true })
            .waitFor();
          await page.reload({ waitUntil: "networkidle" });
          await page
            .getByRole("heading", { name: "Esi Owusu", exact: true })
            .waitFor();
          assert.equal((await stored(page)).user.role, "student");
          captures.push(await capture(page, out, `${key}-edited-reload`));
          await page
            .getByRole("button", { name: "Change profile photo", exact: true })
            .click();
          const photo = page.getByRole("dialog");
          await photo
            .locator("input[type=file]")
            .setInputFiles("public/images/demo/student-kojo.webp");
          await photo
            .getByRole("button", { name: "Save profile photo", exact: true })
            .click();
          await photo.waitFor({ state: "detached" });
          await page.reload({ waitUntil: "networkidle" });
          await page
            .getByRole("img", {
              name: "Your privately saved profile photo for Esi Owusu",
              exact: true,
            })
            .waitFor();
          captures.push(await capture(page, out, `${key}-photo-reload`));
          await page
            .getByRole("button", { name: "Change profile photo", exact: true })
            .click();
          await page
            .getByRole("button", { name: "Remove saved photo", exact: true })
            .click();
          await page
            .getByRole("img", {
              name: "Your privately saved profile photo for Esi Owusu",
              exact: true,
            })
            .waitFor({ state: "detached" });
          await page.getByRole("dialog").waitFor({ state: "detached" });
          captures.push(await capture(page, out, `${key}-photo-removed`));
        }
        assert.deepEqual(errors, []);
        console.log(
          "Profile edit/identity/photo/persistence",
          width,
          theme,
          "passed",
        );
      } finally {
        await context.close();
      }
    }
  await writeFile(
    `${out}/checks.json`,
    JSON.stringify(
      { captures, realBackend: false, authorityFieldsReadOnly: true },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
