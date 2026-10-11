import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { launchAuditBrowser } from "./audit/browser.mjs";
import { checkForms } from "./phase5/forms.mjs";
import { checkTour } from "./phase5/tour.mjs";
import { checkPhoto } from "./phase5/photo.mjs";
import { checkSession } from "./phase5/session.mjs";
import { checkAuthDelivery } from "./phase5/delivery.mjs";
import { checkStates } from "./phase5/states.mjs";
const production = process.env.AUDIT_PROD_BASE_URL ?? "http://127.0.0.1:3001";
const dev = process.env.AUDIT_DEV_BASE_URL ?? "http://127.0.0.1:3000";
const output = resolve(process.env.AUDIT_OUTPUT_DIR ?? ".cache/phase5/results");
await mkdir(output, { recursive: true });
const browser = await launchAuditBrowser([], { multiProcess: true });
// Continue only against the same application build, e.g. after fixing a runner.
const results =
  process.env.AUDIT_CONTINUE === "1"
    ? JSON.parse(await readFile(`${output}/auth-browser.json`, "utf8"))
    : {};
const checks = {
  forms: () => checkForms(browser, production, output),
  tour: () => checkTour(browser, production, output),
  photo: () => checkPhoto(browser, production, output),
  session: () => checkSession(browser, production),
  states: () => checkStates(browser, dev, production, output),
  delivery: () => checkAuthDelivery(browser, production, output),
};
try {
  for (const name of (process.env.AUDIT_CHECKS ?? Object.keys(checks).join(",")).split(",")) {
    if (!checks[name]) throw new Error(`Unknown auth audit: ${name}`);
    results[name] = await checks[name]();
    await writeFile(`${output}/auth-browser.json`, JSON.stringify(results, null, 2));
    console.log(`Auth ${name} audit passed`);
  }
} finally {
  await writeFile(`${output}/auth-browser.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
