import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { capture } from "./helpers.mjs";
import { checkApiCancel } from "./api-cancel.mjs";
export async function checkApiTicket(page, output, key, fixture) {
  const captures = [],
    dialog = page.getByRole("dialog");
  fixture.state.ticketMode = "error";
  await page.getByRole("button", { name: "View ticket", exact: true }).click();
  await dialog
    .getByText("Your ticket needs another try.", { exact: true })
    .waitFor();
  assert.equal(await dialog.locator(".event-ticket-qr").count(), 0);
  assert.equal(
    await dialog
      .getByText("DEMO ONLY · NOT VALID FOR ENTRY", { exact: true })
      .count(),
    0,
  );
  captures.push(await capture(page, output, `${key}-ticket-error`));
  fixture.state.ticketMode = "ok";
  fixture.state.ticketDelay = 700;
  await dialog.getByRole("button", { name: "Try again", exact: true }).click();
  await dialog.getByText("Loading your ticket…", { exact: true }).waitFor();
  await dialog
    .getByRole("img", { name: "Publisher-issued ticket QR", exact: true })
    .waitFor();
  assert.ok((await dialog.textContent()).includes("Reference: MOCK-E1"));
  captures.push(await capture(page, output, `${key}-publisher-ticket`));
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  fixture.state.ticketDelay = 0;
  fixture.state.ticketMode = "revoked";
  await page.getByRole("button", { name: "View ticket", exact: true }).click();
  await dialog
    .getByText(
      "This ticket has been revoked. It cannot be used for admission.",
      { exact: true },
    )
    .waitFor();
  assert.equal(await dialog.locator(".event-ticket-qr").count(), 0);
  captures.push(await capture(page, output, `${key}-ticket-revoked`));
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  fixture.state.ticketMode = "wrong-event";
  await page.getByRole("button", { name: "View ticket", exact: true }).click();
  await dialog
    .getByText(
      "The service returned a ticket for another event. Please retry.",
      { exact: true },
    )
    .waitFor();
  assert.equal(await dialog.locator(".event-ticket-qr").count(), 0);
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  fixture.state.ticketMode = "ok";
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Add to calendar", exact: true })
    .click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "campusone-e1.ics");
  const text = await readFile(await download.path(), "utf8");
  assert.match(text, /DTSTART:20261016T180000Z/);
  assert.ok(!text.includes("SUMMARY:DEMO:"));
  assert.match(text, /STATUS:CONFIRMED/);
  captures.push(await checkApiCancel(page, output, key, fixture));
  return captures;
}
