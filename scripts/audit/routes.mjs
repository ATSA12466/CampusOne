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
  const screens = files
    .filter((file) => file.endsWith("page.tsx"))
    .map((file) => {
      const parts = relative(directory, join(directory, file, ".."))
        .split("/")
        .filter((part) => part && !part.startsWith("("));
      const pattern = `/${parts.join("/")}`;
      if (pattern.includes("[")) {
        const id = detailSamples[pattern];
        if (!id) throw new Error(`Add a detail-screen demo ID for ${pattern}`);
        return { pattern, path: pattern.replace("[id]", id) };
      }
      return {
        pattern,
        path: pattern,
        ...(pattern === "/design"
          ? { expectedStatus: process.env.AUDIT_DESIGN_DEV === "1" ? 200 : 404 }
          : {}),
      };
    })
    .filter((screen) => screen.path !== "/")
    .sort((a, b) => a.path.localeCompare(b.path));
  if (process.env.AUDIT_ALL_ENTITIES !== "1") return screens;
  await import("../foundation/load-typescript.mjs");
  const { demoCatalog } = await import(
    "../../src/services/demo/catalog.service.ts"
  );
  const collections = {
    "/academics/resources/[id]": "resources",
    "/accommodation/[id]": "accommodation",
    "/announcements/[id]": "announcements",
    "/clubs/[id]": "clubs",
    "/events/[id]": "events",
    "/marketplace/[id]": "marketplace",
    "/opportunities/[id]": "opportunities",
  };
  for (const [pattern, collection] of Object.entries(collections)) {
    const result = await demoCatalog.list(collection, { pageSize: 30 });
    if (result.hasMore)
      throw new Error(
        "Final route audit must include all detail records, not a truncated sample",
      );
    for (const item of result.items) {
      const path = pattern.replace("[id]", encodeURIComponent(item.id));
      if (!screens.some((s) => s.path === path))
        screens.push({ pattern, path });
    }
  }
  return screens.sort((a, b) => a.path.localeCompare(b.path));
}

export function screenshotName(path) {
  return path.replaceAll("/", "-").replace(/^-/, "") || "index";
}
