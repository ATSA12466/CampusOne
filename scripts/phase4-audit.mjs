import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { launchAuditBrowser } from "./audit/browser.mjs";
import { checkHome } from "./phase4/home.mjs";
import { checkMedia } from "./phase4/media.mjs";
import { checkStates } from "./phase4/states.mjs";
import { checkClock } from "./phase4/clock.mjs";
import { checkHomeDelivery } from "./phase4/delivery.mjs";
const production = process.env.AUDIT_PROD_BASE_URL ?? "http://127.0.0.1:3001";
const dev = process.env.AUDIT_DEV_BASE_URL ?? "http://127.0.0.1:3000";
const output = resolve(process.env.AUDIT_OUTPUT_DIR ?? ".cache/phase4/results");
await mkdir(output, { recursive: true });
const browser = await launchAuditBrowser([], { multiProcess: true });
// Continue only when testing the same unchanged production build after fixing a runner.
const results =
  process.env.AUDIT_CONTINUE === "1"
    ? JSON.parse(await readFile(`${output}/home-browser.json`, "utf8"))
    : {};
const checks = {
  home: () => checkHome(browser, production, output),
  media: () => checkMedia(browser, production, output),
  states: () => checkStates(browser, dev, production, output),
  clock: () => checkClock(browser, production),
  delivery: () => checkHomeDelivery(browser, production, output),
};
try {
  for (const name of (process.env.AUDIT_CHECKS ?? Object.keys(checks).join(",")).split(",")) {
    if (!checks[name]) throw new Error(`Unknown Home audit: ${name}`);
    results[name] = await checks[name]();
    await writeFile(`${output}/home-browser.json`, JSON.stringify(results, null, 2));
    console.log(`Home ${name} audit passed`);
  }
} finally {
  await writeFile(`${output}/home-browser.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
