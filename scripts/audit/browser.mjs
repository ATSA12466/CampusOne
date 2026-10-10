import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

// Audit tooling is isolated from the app's dependencies and production bundle.
const require = createRequire(
  join(resolve(process.env.AUDIT_TOOLING_DIR ?? ".cache/design-audit/tooling"), "package.json"),
);
const { chromium: playwrightChromium } = require("playwright");
const {
  default: chromium,
  inflate,
  setupLambdaEnvironment,
} = await import(require.resolve("@sparticuz/chromium"));
export const { default: AxeBuilder } = await import(require.resolve("@axe-core/playwright"));

export async function launchAuditBrowser(extraArgs = [], { multiProcess = false } = {}) {
  const libraryDirectory = await inflate(
    join(dirname(require.resolve("@sparticuz/chromium")), "../bin/al2023.tar.br"),
  );
  setupLambdaEnvironment(join(libraryDirectory, "lib"));
  const executablePath = await chromium.executablePath();
  const excluded = [
    "--disable-web-security",
    "--allow-running-insecure-content",
    ...(multiProcess ? ["--single-process", "--in-process-gpu"] : []),
  ];
  const args = chromium.args.filter((arg) => !excluded.includes(arg));
  return playwrightChromium.launch({
    executablePath,
    args: [...args, ...extraArgs],
    headless: true,
  });
}

export async function seedOnboarding(context) {
  await context.addInitScript(() => {
    localStorage.setItem(
      "campusone-onboarding",
      JSON.stringify({ state: { completed: true }, version: 0 }),
    );
  });
}

export async function restrictToApp(context, baseUrl) {
  const origin = new URL(baseUrl).origin;
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.origin === origin || ["data:", "blob:"].includes(url.protocol)
      ? route.continue()
      : route.abort("blockedbyclient");
  });
}

export async function waitForScreen(page) {
  await page.locator("h1").first().waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolveFrame) =>
      requestAnimationFrame(() => requestAnimationFrame(resolveFrame)),
    );
  });
}

export function screenMetrics() {
  const width = window.innerWidth;
  const visible = (element) =>
    element.getClientRects().length > 0 &&
    !element.closest('[aria-hidden="true"]') &&
    getComputedStyle(element).visibility !== "hidden" &&
    getComputedStyle(element).opacity !== "0";
  const interactive = Array.from(document.querySelectorAll("a, button, input, select, textarea"))
    .filter(visible)
    .map((element) => ({
      label:
        element.getAttribute("aria-label") ||
        element.textContent?.trim().slice(0, 70) ||
        element.getAttribute("name"),
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
    }));
  const overflowing = Array.from(document.querySelectorAll("body *"))
    .filter(visible)
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.right > width + 1 || rect.left < -1;
    })
    .slice(0, 10)
    .map((element) => ({
      tag: element.tagName,
      className: element.getAttribute("class"),
      text: element.textContent?.trim().slice(0, 100),
    }));
  const style = getComputedStyle(document.body);
  return {
    viewportWidth: width,
    documentWidth: document.documentElement.scrollWidth,
    background: style.backgroundColor,
    fontFamily: style.fontFamily,
    imageCount: document.querySelectorAll("main img").length,
    smallTargets: interactive.filter((item) => item.width < 44 || item.height < 44),
    overflowing,
    gridTemplates: Array.from(document.querySelectorAll('[class*="grid-cols-["]')).map(
      (element) => ({
        className: element.className,
        columns: getComputedStyle(element).gridTemplateColumns,
      }),
    ),
  };
}
