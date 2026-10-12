// Each server test file runs in an isolated process: files redirect the shared
// FileStore directory via CAMPUSONE_DATA_DIR, so sharing one process lets slow
// tests (password hashing) span another file's directory switch.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const files = [
  "./server/auth.test.mjs",
  "./server/permissions.test.mjs",
  "./server/registry.test.mjs",
  "./server/admin.test.mjs",
  "./server/mobile-auth.test.mjs",
  "./server/campus.test.mjs",
  "./server/attendance.test.mjs",
  "./server/messaging.test.mjs",
];
const cwd = fileURLToPath(new URL("./", import.meta.url));
let failed = 0;
for (const file of files) {
  console.log(`\n--- server file: ${file} (isolated process) ---`);
  const result = spawnSync(process.execPath, ["--import", "./foundation/load-typescript.mjs", file], {
    cwd,
    stdio: "inherit",
    timeout: 120000,
  });
  if (result.error || result.signal || result.status !== 0) {
    console.error(`server file failed: ${file}`, result.error?.message ?? result.signal ?? result.status);
    failed += 1;
  }
}
if (failed > 0) {
  console.error(`\n${failed} server test file(s) failed.`);
  process.exit(1);
}
console.log("\nAll server test files passed.");
