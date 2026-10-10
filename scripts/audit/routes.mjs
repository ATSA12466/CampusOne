import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

// One known demo ID per detail-screen pattern; all existing URLs remain intact.
export const detailSamples = {
  "/academics/resources/[id]": "r1",
  "/accommodation/[id]": "h1",
  "/announcements/[id]": "a1",
  "/clubs/[id]": "club-1",
  "/events/[id]": "e1",
  "/marketplace/[id]": "mk1",
  "/opportunities/[id]": "o1",
};

export async function listScreens(directory = "src/app") {
  const files = await readdir(directory, { recursive: true });
  return files.filter((file) => file.endsWith("page.tsx")).map((file) => {
    const parts = relative(directory, join(directory, file, "..")).split("/").filter((part) => part && !part.startsWith("("));
    const pattern = `/${parts.join("/")}`;
    if (pattern.includes("[")) {
      const id = detailSamples[pattern];
      if (!id) throw new Error(`Add a detail-screen demo ID for ${pattern}`);
      return { pattern, path: pattern.replace("[id]", id) };
    }
    return { pattern, path: pattern };
  }).filter((screen) => screen.path !== "/").sort((a, b) => a.path.localeCompare(b.path));
}

export function screenshotName(path) {
  return path.replaceAll("/", "-").replace(/^-/, "") || "index";
}
