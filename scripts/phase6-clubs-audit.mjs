import { mkdir, writeFile } from "node:fs/promises";
import { launchAuditBrowser } from "./audit/browser.mjs";
import { directoryChecks, detailMatrix } from "./phase6/clubs/directory.mjs";
import { privacyChecks, storageAndMediaChecks, deliveryChecks } from "./phase6/clubs/states.mjs";
import { membershipChecks, executiveChecks } from "./phase6/clubs/membership.mjs";
const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3000",
  output = process.env.AUDIT_OUTPUT_DIR ?? ".cache/phase6/clubs/browser";
await mkdir(output, { recursive: true });
const browser = await launchAuditBrowser([], { multiProcess: true });
try {
  const checks = {};
  for (const [name, run] of Object.entries({
    directory: directoryChecks,
    details: detailMatrix,
    membership: membershipChecks,
    executive: executiveChecks,
    privacy: privacyChecks,
    resilience: storageAndMediaChecks,
    delivery: deliveryChecks,
  })) {
    if (process.env.AUDIT_GROUPS && !process.env.AUDIT_GROUPS.split(",").includes(name)) continue;
    checks[name] = await run(browser, base, output);
    await writeFile(`${output}/checks.json`, JSON.stringify(checks, null, 2));
  }
  console.log("Clubs browser groups passed:", Object.keys(checks));
} finally {
  await browser.close();
}
