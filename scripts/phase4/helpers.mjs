import { readFile, readdir } from "node:fs/promises";
import { seedOnboarding, restrictToApp } from "../audit/browser.mjs";
export { capture, checkTrap, focusIs, visit } from "../phase3/helpers.mjs";
export async function homeContext(browser, baseUrl, width = 360, colorScheme = "light") {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    colorScheme,
    reducedMotion: "reduce",
  });
  await seedOnboarding(context);
  await restrictToApp(context, baseUrl);
  return context;
}
export async function chunksWith(marker) {
  const directory = ".next/static/chunks",
    files = (await readdir(directory)).filter((file) => file.endsWith(".js"));
  return (
    await Promise.all(
      files.map(async (file) =>
        (await readFile(`${directory}/${file}`, "utf8")).includes(marker) ? file : null,
      ),
    )
  ).filter(Boolean);
}
export const scriptName = (request) => new URL(request.url()).pathname.split("/").at(-1);
export async function selectVideo(page) {
  await page.getByRole("button", { name: "Go to slide 2", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-label="Go to slide 2"]')?.getAttribute("aria-current") ===
      "true",
  );
  return page.getByRole("button", { name: "Play the preview", exact: true });
}
