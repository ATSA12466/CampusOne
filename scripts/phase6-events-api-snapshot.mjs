import { execFileSync } from "node:child_process";
import { copyFile, mkdir, symlink, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
const root = process.cwd(),
  target = resolve(root, ".cache/phase6/events/api-app");
const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
let copied = 0;
for (const file of files) {
  if (file.split("/").some((part) => part.startsWith(".env"))) continue;
  const path = resolve(root, file);
  try {
    if (!(await stat(path)).isFile()) continue;
  } catch {
    continue;
  }
  const destination = resolve(target, file);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(path, destination);
  copied++;
}
try {
  await symlink(resolve(root, "node_modules"), resolve(target, "node_modules"), "dir");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
}
console.log(
  `Copied ${copied} eligible source files to the ignored API verification snapshot (no .git, secrets, dependencies or generated caches copied).`,
);
