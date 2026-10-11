import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { launchAuditBrowser } from "./audit/browser.mjs";
import {
  authContext,
  capture,
  visit,
  trackErrors,
} from "./phase6/events/helpers.mjs";
import { storageWorkflows } from "./phase6/social/storage-workflows.mjs";
import { socialWorkflows } from "./phase6/social/workflows.mjs";
const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3001",
  out = process.env.AUDIT_OUTPUT_DIR ?? ".cache/phase6/social/browser";
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
        for (const path of ["/community", "/messages", "/notifications"]) {
          await visit(page, base, path);
          captures.push(
            await capture(page, out, `${key}-${path.slice(1)}-overview`),
          );
        }
        if (width !== 768)
          await socialWorkflows(page, base, out, key, captures);
        assert.deepEqual(errors, []);
        console.log(
          "Social feed/threads/read-state/photo/cross-tab",
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
    for (const path of ["/messages", "/notifications"]) {
      await visit(page, base, path);
      assert.equal(
        await page
          .getByRole("button", { name: "Start a conversation", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Mark as read", exact: true })
          .count(),
        0,
      );
      captures.push(await capture(page, out, `guest-${path.slice(1)}`));
    }
  } finally {
    await context.close();
  }
  await storageWorkflows(browser, base, out, captures);
  await writeFile(
    `${out}/checks.json`,
    JSON.stringify(
      { captures, realBackend: false, privateDeviceModeVerified: true },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
console.log(
  "Social audit completed",
  captures.length,
  "captures; exitCode",
  process.exitCode ?? 0,
);
