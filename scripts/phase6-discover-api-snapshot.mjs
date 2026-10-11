import { execFileSync } from "node:child_process";
import { mkdir, copyFile, stat, symlink } from "node:fs/promises";
import { resolve, dirname } from "node:path";
const root = process.cwd(),
  target = resolve(root, ".cache/phase6/discover/api-app");
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
  const source = resolve(root, file);
  try {
    if (!(await stat(source)).isFile()) continue;
  } catch {
    continue;
  }
  const destination = resolve(target, file);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
  copied++;
}
try {
  await symlink(
    resolve(root, "node_modules"),
    resolve(target, "node_modules"),
    "dir",
  );
} catch (cause) {
  if (cause.code !== "EEXIST") throw cause;
}
console.log(
  `Copied ${copied} eligible source files; no .git, credentials, .env, build output or dependency tree copied.`,
);
