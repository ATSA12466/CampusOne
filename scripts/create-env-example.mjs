import { copyFile } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";
try {
  await copyFile(
    fileURLToPath(new URL("../config/env.example", import.meta.url)),
    fileURLToPath(new URL("../.env.example", import.meta.url)),
    constants.COPYFILE_EXCL,
  );
  console.log(
    "Created ignored .env.example. Copy it to .env.local and configure your environment; do not commit either file.",
  );
} catch (error) {
  if (error.code === "EEXIST") console.log(".env.example already exists; it was not overwritten.");
  else throw error;
}
