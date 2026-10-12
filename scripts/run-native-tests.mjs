import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { selectedNativeSuites } from "./release/native-suites.mjs";
const version = process.versions.node.split(".").map(Number);
if (version[0] < 22 || (version[0] === 22 && version[1] < 15))
  throw new Error("Native suites require Node 22.15+.");
const suites = selectedNativeSuites(process.argv.slice(2)),
  root = new URL("../", import.meta.url);
for (const suite of suites) {
  console.log(`\n--- Native suite: ${suite.name} (isolated process) ---`);
  const result = spawnSync(process.execPath, [fileURLToPath(suite.file)], {
    cwd: root,
    stdio: "inherit",
    timeout: 180000,
  });
  if (result.error || result.signal || result.status !== 0) {
    console.error(
      `Native suite failed: ${suite.name}`,
      result.error?.message ?? result.signal ?? result.status,
    );
    process.exit(1);
  }
}
console.log(`\nAll ${suites.length} isolated native suites passed.`);
