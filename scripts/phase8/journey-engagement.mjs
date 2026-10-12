import assert from "node:assert/strict";
import { visit, capture, stored } from "../phase6/events/helpers.mjs";
export async function engagementJourney(page, base, out, captures) {
  const dialog = page.getByRole("dialog");
  await visit(page, base, "/events/e1");
  await page.getByRole("button", { name: "RSVP", exact: true }).click();
  await dialog.getByRole("checkbox").check();
  await dialog
    .getByRole("button", { name: "Confirm demo RSVP", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Demo ticket", exact: true }).click();
  await dialog
    .getByRole("img", {
      name: "Demonstration QR — not valid for entry",
      exact: true,
    })
    .waitFor();
  assert.deepEqual((await stored(page, "campusone-app")).registrations, ["e1"]);
  captures.push(await capture(page, out, "journey-invalid-for-entry-ticket"));
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Cancel RSVP", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Cancel RSVP", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "RSVP", exact: true }).waitFor();
  assert.deepEqual((await stored(page, "campusone-app")).registrations, []);
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("campusone-app"));
    s.state.memberships = [];
    localStorage.setItem("campusone-app", JSON.stringify(s));
  });
  await visit(page, base, "/clubs/club-1");
  await page
    .getByRole("button", { name: "Request to join", exact: true })
    .click();
  await dialog.getByRole("checkbox").check();
  await dialog
    .getByRole("button", { name: "Submit membership request", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByText("Membership: pending", { exact: true }).waitFor();
  await visit(page, base, "/sign-in?next=%2Fclubs");
  await page
    .getByLabel("Role (demo switch)", { exact: true })
    .selectOption("club-executive");
  await page
    .getByRole("button", { name: "Sign in (demo)", exact: true })
    .click();
  await page.waitForURL((u) => u.pathname === "/clubs");
  const panel = page.locator("#executive-reviews");
  await panel
    .getByRole("button", { name: "Approve", exact: true })
    .first()
    .click();
  await panel
    .getByText("No pending requests right now.", { exact: true })
    .waitFor();
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    (await stored(page, "campusone-app")).memberships.find(
      (m) => m.clubId === "club-1",
    ).status,
    "approved",
  );
  await visit(page, base, "/clubs/club-1");
  await page.getByText("Membership: approved", { exact: true }).waitFor();
  captures.push(await capture(page, out, "journey-executive-approval"));
}
