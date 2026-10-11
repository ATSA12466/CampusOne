import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { launchAuditBrowser } from "./audit/browser.mjs";
import {
  authContext,
  capture,
  visit,
  trackErrors,
  stored,
} from "./phase6/events/helpers.mjs";
const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3001",
  out = process.env.AUDIT_OUTPUT_DIR ?? ".cache/phase6/secondary/browser";
await mkdir(out, { recursive: true });
const browser = await launchAuditBrowser([], { multiProcess: true }),
  captures = [];
try {
  for (const width of [360, 768, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}`;
      try {
        for (const path of [
          "/announcements",
          "/announcements/a1",
          "/src-office",
          "/media",
          "/advertising",
          "/participation",
          "/management",
          "/settings",
        ]) {
          await visit(page, base, path);
          captures.push(
            await capture(
              page,
              out,
              `${key}-${path.slice(1).replaceAll("/", "-")}`,
            ),
          );
        }
        if (width !== 768) {
          await visit(page, base, "/announcements");
          assert.equal(
            await page.locator("main").getByRole("heading", { level: 2 }).count(),
            6,
          );
          await page
            .getByRole("button", { name: "Page 2", exact: true })
            .click();
          assert.equal(
            await page.locator("main").getByRole("heading", { level: 2 }).count(),
            6,
          );
          await page
            .getByRole("button", { name: "Page 1", exact: true })
            .click();
          await page
            .getByRole("button", {
              name: "Save SRC study space extension approved",
              exact: true,
            })
            .click();
          await page
            .getByRole("button", {
              name: "Unsave SRC study space extension approved",
              exact: true,
            })
            .waitFor();
          await page.getByRole("radio", { name: "Saved", exact: true }).click();
          assert.equal(
            await page.locator("main").getByRole("heading", { level: 2 }).count(),
            1,
          );
          await page.reload({ waitUntil: "networkidle" });
          await page
            .getByRole("button", {
              name: "Unsave SRC study space extension approved",
              exact: true,
            })
            .waitFor();
          captures.push(
            await capture(page, out, `${key}-announcements-save-reload`),
          );
          await visit(page, base, "/src-office");
          await page
            .getByRole("button", { name: "Submit request", exact: true })
            .click();
          await page
            .getByText("Request title is required", { exact: true })
            .waitFor();
          await page
            .getByLabel("Request title", { exact: true })
            .fill("A little quieter study space");
          await page
            .getByLabel("Request description", { exact: true })
            .fill(
              "Please keep this valid local request with my current profile only.",
            );
          await page
            .getByRole("button", { name: "Submit request", exact: true })
            .click();
          await page
            .getByText("A little quieter study space", { exact: true })
            .waitFor();
          assert.equal(
            await page
              .getByLabel("Request title", { exact: true })
              .inputValue(),
            "",
          );
          await page.reload({ waitUntil: "networkidle" });
          await page
            .getByText("A little quieter study space", { exact: true })
            .waitFor();
          assert.ok(
            (await stored(page, "campusone-app")).srcRequests.some(
              (r) => r.title === "A little quieter study space",
            ),
          );
          captures.push(
            await capture(page, out, `${key}-src-private-request-reload`),
          );
          const requests = [];
          page.on("request", (r) => {
            if (/\/media\/demo\/.*\.(mp3|webm)/.test(r.url()))
              requests.push(r.url());
          });
          await visit(page, base, "/media");
          assert.equal(requests.length, 0);
          const audioCard = page
            .locator("main section")
            .filter({
              has: page.getByRole("heading", {
                name: "CC0 sound-effect playback sample",
                exact: true,
              }),
            });
          await audioCard
            .getByRole("button", { name: "Open sample player", exact: true })
            .click();
          const audio = page.locator("audio");
          await audio.evaluate(async (el) => {
            await el.play();
          });
          await page.waitForFunction(() => {
            const a = document.querySelector("audio");
            return a && a.currentTime > 0 && !a.paused;
          });
          assert.ok((await audio.evaluate((el) => el.duration)) > 0);
          await audio.evaluate((el) => el.pause());
          captures.push(await capture(page, out, `${key}-actual-cc0-audio`));
          const videoCard = page
            .locator("main section")
            .filter({
              has: page.getByRole("heading", {
                name: "A botanical breathing pause",
                exact: true,
              }),
            });
          await videoCard
            .getByRole("button", { name: "Open sample player", exact: true })
            .click();
          assert.equal(await page.locator("audio").count(), 0);
          await page.locator("video").evaluate(async (el) => {
            await el.play();
          });
          await page.waitForFunction(() => {
            const v = document.querySelector("video");
            return v && v.currentTime > 0 && !v.paused;
          });
          await page.locator("video").evaluate((el) => el.pause());
          captures.push(await capture(page, out, `${key}-actual-cc0-video`));
        }
        assert.deepEqual(errors, []);
        console.log(
          "Secondary layouts, canonical save, private request, real deferred audio/video",
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
      { captures, mockedBackend: false, realBackendVerified: false },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
