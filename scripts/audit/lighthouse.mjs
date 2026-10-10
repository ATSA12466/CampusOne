import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { launchAuditBrowser } from "./browser.mjs";

const require = createRequire(
  join(resolve(process.env.AUDIT_TOOLING_DIR ?? ".cache/design-audit/tooling"), "package.json"),
);
const { default: lighthouse } = await import(require.resolve("lighthouse"));
const baseUrl = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3000";
const output = resolve(process.env.AUDIT_OUTPUT_DIR ?? ".cache/design-audit/results");
const port = Number(process.env.AUDIT_CHROME_PORT ?? "9222");
await mkdir(output, { recursive: true });
// Multi-process Chromium is needed for Lighthouse's trace filmstrip collector.
const browser = await launchAuditBrowser(
  [`--remote-debugging-port=${port}`, "--run-all-compositor-stages-before-draw"],
  { multiProcess: true },
);
try {
  const result = await lighthouse(`${baseUrl}/home`, {
    port,
    output: ["json", "html"],
    onlyCategories: ["performance", "accessibility"],
    logLevel: "error",
    formFactor: "mobile",
    screenEmulation: {
      mobile: true,
      width: 360,
      height: 800,
      deviceScaleFactor: 1,
      disabled: false,
    },
  });
  if (!result || result.lhr.runtimeError)
    throw new Error(result?.lhr.runtimeError?.message ?? "No Lighthouse result");
  if (process.env.AUDIT_SAVE_TRACE === "1") {
    await writeFile(join(output, "trace.json"), JSON.stringify(result.artifacts.Trace));
  }
  const reports = result.report;
  await writeFile(join(output, "lighthouse-home.json"), reports[0]);
  await writeFile(join(output, "lighthouse-home.html"), reports[1]);
  const { categories, audits, fetchTime, environment, finalDisplayedUrl } = result.lhr;
  const performance =
    categories.performance.score === null ? null : categories.performance.score * 100;
  const auditErrors = Object.values(audits)
    .filter((audit) => audit.scoreDisplayMode === "error")
    .map((audit) => ({ id: audit.id, message: audit.errorMessage }));
  console.log(
    JSON.stringify(
      {
        fetchTime,
        environment,
        finalDisplayedUrl,
        performance,
        accessibility: categories.accessibility.score * 100,
        fcp: audits["first-contentful-paint"].displayValue,
        lcp: audits["largest-contentful-paint"].displayValue,
        tbt: audits["total-blocking-time"].displayValue,
        cls: audits["cumulative-layout-shift"].displayValue,
        auditErrors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
