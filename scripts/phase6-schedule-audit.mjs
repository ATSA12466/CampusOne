import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { launchAuditBrowser } from "./audit/browser.mjs";
import {
  authContext,
  visit,
  capture,
  trackErrors,
} from "./phase6/events/helpers.mjs";
const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3001",
  out = ".cache/phase6/schedule";
await mkdir(out, { recursive: true });
const browser = await launchAuditBrowser([], { multiProcess: true }),
  captures = [];
try {
  for (const width of [360, 768, 1280])
    for (const theme of ["light", "dark"]) {
      const c = await authContext(browser, base, width, theme),
        p = await c.newPage(),
        errors = trackErrors(p),
        key = `${width}-${theme}`;
      try {
        await visit(p, base, "/timetable");
        captures.push(await capture(p, out, `${key}-timetable`));
        await visit(p, base, "/calendar");
        captures.push(await capture(p, out, `${key}-calendar-week`));
        await p.getByRole("radio", { name: "Month", exact: true }).click();
        captures.push(await capture(p, out, `${key}-calendar-month`));
        const month = await p.locator("main h2").first().innerText();
        await p.getByRole("button", { name: "Next", exact: true }).click();
        await p.waitForFunction(
          (old) => document.querySelector("main h2")?.textContent !== old,
          month,
        );
        assert.notEqual(await p.locator("main h2").first().innerText(), month);
        await p.getByRole("radio", { name: "Agenda", exact: true }).click();
        captures.push(await capture(p, out, `${key}-calendar-agenda`));
        if (width !== 768) {
          await visit(p, base, "/timetable");
          await p
            .getByRole("textbox", { name: "Class / course", exact: true })
            .fill("TEST 101");
          await p
            .getByRole("textbox", { name: "Class venue", exact: true })
            .fill("Test lab");
          await p
            .getByRole("button", { name: "Add class", exact: true })
            .click();
          await p.waitForFunction(
            () =>
              [...document.querySelectorAll("h3")].filter(
                (e) => e.textContent === "TEST 101",
              ).length === 2,
          );
          await p.reload({ waitUntil: "networkidle" });
          await p
            .getByRole("button", { name: "Edit class", exact: true })
            .click();
          await p
            .getByRole("textbox", { name: "Class / course", exact: true })
            .fill("TEST 102");
          await p
            .getByRole("button", { name: "Update class", exact: true })
            .click();
          await p.waitForFunction(
            () =>
              [...document.querySelectorAll("h3")].filter(
                (e) => e.textContent === "TEST 102",
              ).length === 2,
          );
          captures.push(await capture(p, out, `${key}-class-persist-edit`));
          await p
            .getByRole("button", { name: "Delete class", exact: true })
            .click();
          await p
            .getByRole("button", {
              name: "Confirm class deletion",
              exact: true,
            })
            .click();
          await p
            .getByRole("heading", { name: "TEST 102", exact: true })
            .first()
            .waitFor({ state: "hidden" });
          await visit(p, base, "/calendar");
          await p
            .getByRole("textbox", { name: "Plan title", exact: true })
            .fill("A thoughtful study hour");
          await p
            .getByRole("textbox", { name: "Plan location", exact: true })
            .fill("Library");
          await p
            .getByRole("button", { name: "Add personal plan", exact: true })
            .click();
          await p.waitForFunction(
            () =>
              [...document.querySelectorAll("h3")].filter(
                (e) => e.textContent === "A thoughtful study hour",
              ).length === 2,
          );
          const downloadPromise = p.waitForEvent("download");
          await p
            .getByRole("button", {
              name: "Export shown schedule (.ics)",
              exact: true,
            })
            .click();
          const download = await downloadPromise;
          const text = await readFile(await download.path(), "utf8");
          assert.ok(text.includes("BEGIN:VCALENDAR"));
          assert.ok(text.includes("A thoughtful study hour"));
          await p.reload({ waitUntil: "networkidle" });
          await p
            .getByRole("button", { name: "Edit plan", exact: true })
            .waitFor();
          captures.push(await capture(p, out, `${key}-plan-persist-ics`));
          await p
            .getByRole("button", { name: "Delete plan", exact: true })
            .click();
          await p
            .getByRole("button", { name: "Confirm plan deletion", exact: true })
            .click();
          await p
            .getByRole("heading", {
              name: "A thoughtful study hour",
              exact: true,
            })
            .first()
            .waitFor({ state: "hidden" });
        }
        assert.deepEqual(errors, []);
        console.log(
          width,
          theme,
          "calendar views/month navigation/personal schedule/ICS passed",
        );
      } finally {
        await c.close();
      }
    }
  await writeFile(`${out}/checks.json`, JSON.stringify({ captures }, null, 2));
} finally {
  await browser.close();
}
