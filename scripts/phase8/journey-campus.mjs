import assert from "node:assert/strict";
import { visit, capture, stored } from "../phase6/events/helpers.mjs";
export async function campusJourney(page, base, out, captures) {
  await visit(page, base, "/opportunities/o1");
  await page
    .getByRole("button", { name: "Save for later", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove from saved", exact: true })
    .waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: "Remove from saved", exact: true })
    .waitFor();
  assert.ok(
    (await stored(page, "campusone-app")).bookmarks.some(
      (b) => b.entityType === "opportunity" && b.entityId === "o1",
    ),
  );
  await visit(page, base, "/src-office");
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click();
  await page.locator('#src-title[aria-invalid="true"]').waitFor();
  await page
    .getByLabel("Request title", { exact: true })
    .fill("Audit: weekend study space");
  await page
    .getByLabel("Request description", { exact: true })
    .fill("Please provide a supervised weekend study space for revision.");
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click();
  await page.getByText("Audit: weekend study space", { exact: true }).waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Audit: weekend study space", { exact: true }).waitFor();
  captures.push(await capture(page, out, "journey-private-src-request"));
  await visit(page, base, "/lost-and-found");
  await page
    .getByRole("button", { name: "Create report", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Item name", { exact: true })
    .fill("Audit: blue notebook");
  await dialog
    .getByLabel("Description", { exact: true })
    .fill(
      "A clearly labelled private test report with a required prepared photograph.",
    );
  await dialog
    .getByLabel("Last seen / found location", { exact: true })
    .fill("Campus library entrance");
  await dialog
    .getByRole("button", { name: "Submit photo report", exact: true })
    .click();
  await dialog
    .getByText("Prepare the required photo before submitting.", { exact: true })
    .waitFor();
  await dialog
    .locator("input[type=file]")
    .setInputFiles("public/images/demo/housing-room.webp");
  await dialog
    .getByRole("button", { name: "Use this photo", exact: true })
    .click();
  await dialog.getByText("Prepared photo attached.", { exact: true }).waitFor();
  await dialog
    .getByRole("button", { name: "Submit photo report", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  await page
    .getByRole("heading", { name: "Audit: blue notebook", exact: true })
    .waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByRole("heading", { name: "Audit: blue notebook", exact: true })
    .waitFor();
  captures.push(
    await capture(page, out, "journey-required-photo-report-reload"),
  );
}
