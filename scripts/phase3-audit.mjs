import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { launchAuditBrowser } from "./audit/browser.mjs";
import { checkShell } from "./phase3/shell.mjs";
import { checkSidebar } from "./phase3/sidebar.mjs";
import { checkDelivery } from "./phase3/delivery.mjs";
import { checkSearchStates } from "./phase3/search-states.mjs";
const production = process.env.AUDIT_PROD_BASE_URL ?? "http://127.0.0.1:3001";
const dev = process.env.AUDIT_DEV_BASE_URL ?? "http://127.0.0.1:3000";
const output = resolve(process.env.AUDIT_OUTPUT_DIR ?? ".cache/phase3/results");
await mkdir(output, { recursive: true });
const browser = await launchAuditBrowser([], { multiProcess: true });
const result = {};
try {
  result.shell = await checkShell(browser, production, output);
  result.delivery = await checkDelivery(browser, production, output);
  result.sidebar = await checkSidebar(browser, production);
  result.searchStates = await checkSearchStates(browser, dev, output);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await writeFile(`${output}/shell-browser.json`, JSON.stringify(result, null, 2));
  await browser.close();
}
