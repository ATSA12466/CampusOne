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
  out = process.env.AUDIT_OUTPUT_DIR ?? ".cache/phase6/life/academic-tools";
await mkdir(out, { recursive: true });
const browser = await launchAuditBrowser([], { multiProcess: true }),
  captures = [];
try {
  for (const width of [360, 1280])
    for (const theme of ["light", "dark"]) {
      const c = await authContext(browser, base, width, theme),
        p = await c.newPage(),
        errors = trackErrors(p),
        key = `${width}-${theme}`;
      try {
        await visit(p, base, "/academics");
        await p
          .getByRole("textbox", { name: "Course code", exact: true })
          .fill("TEST 101");
        await p
          .getByRole("spinbutton", { name: "Credits", exact: true })
          .fill("3");
        await p
          .getByRole("spinbutton", { name: "Grade points (0–4)", exact: true })
          .fill("4");
        await p.getByRole("button", { name: "Add grade", exact: true }).click();
        await p.getByText("Estimated GPA: 4.00", { exact: true }).waitFor();
        await p
          .getByRole("textbox", { name: "Course code", exact: true })
          .fill("TEST 102");
        await p
          .getByRole("spinbutton", { name: "Credits", exact: true })
          .fill("1");
        await p
          .getByRole("spinbutton", { name: "Grade points (0–4)", exact: true })
          .fill("2");
        await p.getByRole("button", { name: "Add grade", exact: true }).click();
        await p.getByText("Estimated GPA: 3.50", { exact: true }).waitFor();
        await p
          .getByRole("textbox", { name: "Course / subject", exact: true })
          .fill("TEST 101");
        await p
          .getByRole("textbox", { name: "Note title", exact: true })
          .fill("A useful revision");
        await p
          .getByRole("textbox", { name: "Your notes", exact: true })
          .fill("Explain the example in your own words, then test recall.");
        await p.getByRole("button", { name: "Save note", exact: true }).click();
        await p
          .getByRole("heading", { name: "A useful revision", exact: true })
          .waitFor();
        await p.reload({ waitUntil: "networkidle" });
        await p.getByText("Estimated GPA: 3.50", { exact: true }).waitFor();
        await p
          .getByRole("heading", { name: "A useful revision", exact: true })
          .waitFor();
        captures.push(await capture(p, out, `${key}-persisted-gpa-notes`));
        await p.getByRole("button", { name: "Edit note", exact: true }).click();
        await p
          .getByRole("textbox", { name: "Note title", exact: true })
          .fill("A revised note");
        await p
          .getByRole("button", { name: "Update note", exact: true })
          .click();
        await p
          .getByRole("heading", { name: "A revised note", exact: true })
          .waitFor();
        await p
          .getByRole("button", { name: "Remove TEST 102 grade", exact: true })
          .click();
        await p.getByText("Estimated GPA: 4.00", { exact: true }).waitFor();
        await p
          .getByRole("button", { name: "Delete note", exact: true })
          .click();
        await p
          .getByRole("heading", { name: "A revised note", exact: true })
          .waitFor({ state: "hidden" });
        captures.push(await capture(p, out, `${key}-edited-removed`));
        assert.deepEqual(errors, []);
        console.log(
          width,
          theme,
          "weighted GPA and note create/reload/edit/delete passed",
        );
      } finally {
        await c.close();
      }
    }
  await writeFile(`${out}/checks.json`, JSON.stringify({ captures }, null, 2));
} finally {
  await browser.close();
}
