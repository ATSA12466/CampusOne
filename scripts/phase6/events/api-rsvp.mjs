import assert from "node:assert/strict";
import { visit, capture, stored } from "./helpers.mjs";
export async function checkApiRsvp(page, base, output, key, fixture) {
  const captures = [];
  fixture.state.activityMode = "error";
  await visit(page, base, "/events/e1");
  await page.getByText("Your event plans could not load.", { exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "RSVP", exact: true }).isDisabled(), true);
  assert.equal(
    await page.getByRole("button", { name: "Save Innovation Night", exact: true }).isDisabled(),
    true,
  );
  captures.push(await capture(page, output, `${key}-activity-error`));
  fixture.state.activityMode = "ok";
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByRole("button", { name: "RSVP", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("checkbox").check();
  fixture.state.mutationMode = "error";
  const submit = dialog.getByRole("button", { name: "Confirm RSVP", exact: true });
  await submit.click();
  await dialog
    .getByText("CampusOne couldn't complete this request. Please retry.", { exact: true })
    .waitFor();
  assert.deepEqual(fixture.state.goingIds, []);
  assert.equal(await dialog.getByRole("checkbox").isChecked(), true);
  captures.push(await capture(page, output, `${key}-rsvp-error`));
  fixture.state.mutationMode = "ok";
  fixture.state.mutationDelay = 600;
  const before = fixture.hits.filter((h) => h.method === "PUT" && h.path.endsWith("/rsvp")).length;
  await submit.evaluate((button) => {
    button.click();
    button.click();
  });
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "View ticket", exact: true }).waitFor();
  assert.deepEqual(fixture.state.goingIds, ["e1"]);
  assert.equal(
    fixture.hits.filter((h) => h.method === "PUT" && h.path.endsWith("/rsvp")).length,
    before + 1,
  );
  assert.deepEqual((await stored(page, "campusone-app"))?.registrations ?? [], []);
  await page.getByRole("button", { name: "Save Innovation Night", exact: true }).click();
  await page.getByRole("button", { name: "Unsave Innovation Night", exact: true }).waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "View ticket", exact: true }).waitFor();
  await page.getByRole("button", { name: "Unsave Innovation Night", exact: true }).waitFor();
  assert.ok(
    (await page.locator(".event-detail-actions").textContent()).includes("121 / 300 registered"),
  );
  assert.ok(!(await page.locator(".event-detail-actions").textContent()).includes("122 / 300"));
  assert.ok(
    !((await stored(page, "campusone-app"))?.bookmarks ?? []).some((b) => b.entityType === "event"),
  );
  captures.push(await capture(page, output, `${key}-publisher-count-persistence`));
  fixture.state.mutationDelay = 0;
  return captures;
}
