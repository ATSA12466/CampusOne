/**
 * Brand/crest audit against a running server (web + the shared API).
 *
 *   AUDIT_BASE_URL=http://localhost:3000 node scripts/brand-check.mjs
 *   (npm run audit:brand)
 *
 * Asserts the council-supplied crest reaches every brand surface, that no
 * placeholder "logo slot" or drawn frame came back, and that the scaled files
 * are served with the right type. Needs the design-audit browser tooling:
 *
 *   npm install --prefix .cache/design-audit/tooling --no-package-lock --no-save \
 *     --no-audit --no-fund playwright@1.64.0 @sparticuz/chromium@153.0.0 \
 *     @axe-core/playwright@4.13.0
 */
import "./foundation/load-typescript.mjs";
import { launchAuditBrowser } from "./audit/browser.mjs";

// The TypeScript hook must be registered before the app config is imported.
const { images, srcLogo } = await import("../src/config/images.ts");

const base = (process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const student = {
  email: process.env.AUDIT_STUDENT_EMAIL ?? "ama.student@gctu.edu.gh",
  password: process.env.AUDIT_STUDENT_PASSWORD ?? "CampusOne-Student-01",
};
let passed = 0;
const failures = [];
function check(label, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  ok   ${label}`);
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

console.log(`\nBrand assets (${base})`);
{
  check("config declares the supplied crest", Boolean(srcLogo?.src), String(srcLogo?.src));
  check("crest is labelled as supplied artwork", srcLogo?.provenance === "upload", String(srcLogo?.provenance));
  for (const [name, path] of [
    ["app icon", "/brand/app-icon-512.png"],
    ["apple touch icon", "/brand/apple-touch-icon-180.png"],
    ["favicon", "/brand/favicon-32.png"],
    ["crest", srcLogo?.src],
  ]) {
    if (!path) continue;
    const response = await fetch(base + path).catch(() => null);
    const type = response?.headers.get("content-type") ?? "";
    const bytes = response && response.ok ? (await response.arrayBuffer()).byteLength : 0;
    check(`${name} is served as a PNG`, response?.status === 200 && type.includes("image/png") && bytes > 200, `${response?.status} ${type} ${bytes}B`);
  }
  const html = await (await fetch(`${base}/sign-in`, { headers: { "user-agent": "Twitterbot/1.0" } })).text();
  check("the document announces the favicon", html.includes("/brand/favicon-32.png"), "no icon link found");
  check("the document announces the apple touch icon", html.includes("/brand/apple-touch-icon-180.png"), "no apple icon link found");
  check("generated demo scenes are still labelled", images.campusLife.alt.length > 12, "campusLife alt missing");
}

console.log("\nRendered crest");
const browser = await launchAuditBrowser();
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text().slice(0, 140));
  });
  page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${String(error).slice(0, 140)}`));

  const readCrests = async () =>
    page.evaluate(() => {
      const rect = (img) => Math.round(img.getBoundingClientRect().width);
      return [...document.querySelectorAll("img")]
        .filter((img) => img.currentSrc.includes("src-crest") || img.currentSrc.includes("brand/"))
        .map((img) => ({ src: img.currentSrc.replace(location.origin, ""), natural: img.naturalWidth, box: rect(img), alt: img.alt }));
    });

  await page.goto(`${base}/sign-in`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${base}/sign-in`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const signedOut = await readCrests();
  check("the signed-out header shows the crest", signedOut.some((img) => img.box >= 40 && img.natural >= 256), JSON.stringify(signedOut));
  check("the crest keeps its descriptive alt text", signedOut.some((img) => /Representative Council/.test(img.alt)), signedOut.map((i) => i.alt).join(" | "));
  check("no placeholder logo slot is rendered", !(await page.locator("text=logo slot").count()), "placeholder still on screen");

  await page.goto(`${base}/sign-in`, { waitUntil: "networkidle" });
  await context.request.post(`${base}/api/auth/sign-in`, { data: student });
  for (const route of ["/home", "/academics", "/src-office", "/settings"]) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    const crests = await readCrests();
    const visible = crests.filter((img) => img.box >= 40);
    check(`${route} shows the crest`, visible.length >= 1, JSON.stringify(crests));
    check(`${route} renders no empty placeholder`, !(await page.locator("text=logo slot").count()));
  }
  check("no console or hydration errors on the brand surfaces", consoleErrors.length === 0, consoleErrors.join(" | "));
  await context.close();
} finally {
  await browser.close();
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log("\nFailures:");
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}
