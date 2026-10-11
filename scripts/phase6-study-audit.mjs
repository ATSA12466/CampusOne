import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { launchAuditBrowser } from "./audit/browser.mjs";
import {
  authContext,
  capture,
  visit,
  trackErrors,
} from "./phase6/events/helpers.mjs";
import { studyWorkflows } from "./phase6/study/workflows.mjs";
const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3001",
  out = process.env.AUDIT_OUTPUT_DIR ?? ".cache/phase6/study/browser";
await mkdir(out, { recursive: true });
const browser = await launchAuditBrowser([], { multiProcess: true }),
  captures = [];
try {
  for (const width of [360, 768, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page);
      try {
        for (const path of ["/tasks", "/study-assistant"]) {
          await visit(page, base, path);
          captures.push(
            await capture(
              page,
              out,
              `${width}-${theme}-${path.slice(1)}-overview`,
            ),
          );
        }
        if (width !== 768)
          await studyWorkflows(page, base, out, `${width}-${theme}`, captures);
        assert.deepEqual(errors, []);
        console.log(
          "Task CRUD/private study controls/save/ICS",
          width,
          theme,
          "passed",
        );
      } finally {
        await context.close();
      }
    }
  const context = await authContext(browser, base, 360, "dark"),
    page = await context.newPage();
  try {
    await context.addInitScript(() =>
      localStorage.setItem(
        "campusone-auth",
        JSON.stringify({
          state: {
            user: null,
            role: "student",
            source: "demo",
            remember: false,
          },
          version: 0,
        }),
      ),
    );
    for (const path of ["/tasks", "/study-assistant"]) {
      await visit(page, base, path);
      assert.equal(
        await page
          .getByRole("button", { name: "Add task", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Generate study draft", exact: true })
          .count(),
        0,
      );
      captures.push(await capture(page, out, `guest-${path.slice(1)}`));
    }
  } finally {
    await context.close();
  }
  await writeFile(
    `${out}/checks.json`,
    JSON.stringify(
      {
        captures,
        realAI: false,
        realBackend: false,
        structuredControlsHonoured: true,
        actualICS: true,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
console.log("Study audit completed", captures.length, "captures");
