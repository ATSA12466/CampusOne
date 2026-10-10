import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { launchAuditBrowser } from "./audit/browser.mjs";
import { captureShowcase } from "./phase2/showcase.mjs";
import { checkInteractions } from "./phase2/interactions.mjs";
import { checkUpload } from "./phase2/uploads.mjs";
import { checkTouch } from "./phase2/touch.mjs";
import { checkPublishing } from "./phase2/publishing.mjs";
import { checkThemes } from "./phase2/themes.mjs";
const dev = process.env.AUDIT_DEV_BASE_URL ?? "http://127.0.0.1:3000";
const production = process.env.AUDIT_PROD_BASE_URL ?? "http://127.0.0.1:3001";
const output = resolve(process.env.AUDIT_OUTPUT_DIR ?? ".cache/phase2/results");
await mkdir(output, { recursive: true });
const browser = await launchAuditBrowser([], { multiProcess: true });
const result = {};
try {
  result.showcase = await captureShowcase(browser, dev, output);
  result.interactions = await checkInteractions(browser, dev, output);
  result.touch = await checkTouch(browser, dev);
  result.uploads = await checkUpload(browser, dev, output);
  result.themes = await checkThemes(browser, dev);
  const response = await fetch(`${production}/design`);
  if (response.status !== 404) throw new Error("/design must be HTTP 404 in production");
  result.productionDesign = 404;
  result.publishing = await checkPublishing(browser, production);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await writeFile(`${output}/foundation-browser.json`, JSON.stringify(result, null, 2));
  await browser.close();
}
