import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  AxeBuilder,
  launchAuditBrowser,
  restrictToApp,
  screenMetrics,
  seedOnboarding,
  waitForScreen,
} from "./audit/browser.mjs";
import { detailSamples, listScreens, screenshotName } from "./audit/routes.mjs";

const baseUrl = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3000";
const outputDirectory = resolve(process.env.AUDIT_OUTPUT_DIR ?? ".cache/design-audit/results");
const widths = (process.env.AUDIT_WIDTHS ?? "360,768,1280").split(",").map(Number);
const schemes = (process.env.AUDIT_SCHEMES ?? "light,dark").split(",");
const discovered = [
  ...(await listScreens()),
  { pattern: "not-found", path: "/audit-route-does-not-exist", expectedStatus: 404 },
];
const selectedRoutes = process.env.AUDIT_ROUTES?.split(",").map((value) => value.trim());
const screens = selectedRoutes
  ? discovered.filter((screen) => selectedRoutes.includes(screen.path))
  : discovered;
if (!screens.length) throw new Error("AUDIT_ROUTES matched no discovered screen");
const results = [];
await mkdir(outputDirectory, { recursive: true });

for (const width of widths) {
  for (const colorScheme of schemes) {
    const browser = await launchAuditBrowser();
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      colorScheme,
      reducedMotion: "reduce",
    });
    await seedOnboarding(context);
    await restrictToApp(context, baseUrl);
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    try {
      for (const screen of screens) {
        pageErrors.length = 0;
        const response = await page.goto(`${baseUrl}${screen.path}`, { waitUntil: "networkidle" });
        await waitForScreen(page);
        assert.equal(response?.status(), screen.expectedStatus ?? 200, screen.path);
        assert.equal(
          new URL(page.url()).pathname,
          screen.path,
          `Unexpected redirect: ${screen.path}`,
        );
        assert.deepEqual(pageErrors, [], `Browser exception: ${screen.path}`);
        const screenshot = `${width}-${colorScheme}-${screenshotName(screen.path)}.png`;
        await page.screenshot({
          path: join(outputDirectory, screenshot),
          fullPage: true,
          animations: "disabled",
        });
        const metrics = await page.evaluate(screenMetrics);
        const accessibility =
          width === 360
            ? (
                await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
              ).violations.map((violation) => ({
                id: violation.id,
                impact: violation.impact,
                description: violation.description,
                nodes: violation.nodes.map((node) => ({
                  target: node.target,
                  summary: node.failureSummary,
                })),
              }))
            : undefined;
        results.push({
          ...screen,
          width,
          colorScheme,
          status: response.status(),
          screenshot,
          metrics,
          accessibility,
        });
        await writeFile(join(outputDirectory, "screens.json"), JSON.stringify(results, null, 2));
        console.log(
          `${width} ${colorScheme} ${screen.path}: HTTP ${response.status()}, width ${metrics.documentWidth}, axe ${accessibility?.length ?? "not run"}`,
        );
      }
      if (width === 360 && colorScheme === "light") {
        const invalidDetails = [];
        for (const pattern of Object.keys(detailSamples)) {
          const path = pattern.replace("[id]", "audit-missing-id");
          const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
          // Next.js streamed notFound() responses can use HTTP 200 after headers are sent.
          await page.getByRole("heading", { name: "Page not found", exact: true }).waitFor();
          assert.ok([200, 404].includes(response.status()), `Missing detail response: ${path}`);
          invalidDetails.push({ path, status: response.status(), heading: "Page not found" });
        }
        const response = await page.goto(baseUrl, { waitUntil: "networkidle" });
        assert.equal(new URL(page.url()).pathname, "/home");
        assert.equal(response.status(), 200);
        await writeFile(
          join(outputDirectory, "route-checks.json"),
          JSON.stringify({ rootRedirect: "/home", invalidDetails }, null, 2),
        );
      }
    } finally {
      await browser.close();
    }
  }
}

console.log(`Saved ${results.length} screenshots and route/axe metrics to ${outputDirectory}`);
