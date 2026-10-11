import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { visit, capture } from "./helpers.mjs";
export async function checkApiLegacy(page, base, output, key, fixture) {
  const captures = [];
  await visit(page, base, "/events/e34");
  await page.getByText("Price not supplied", { exact: true }).waitFor();
  await page.getByText("Time not supplied", { exact: true }).waitFor();
  await page.getByText("Start time not supplied", { exact: true }).waitFor();
  captures.push(await capture(page, output, `${key}-legacy-fields`));
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add to calendar", exact: true }).click();
  const download = await downloadPromise,
    text = await readFile(await download.path(), "utf8");
  assert.match(text, /DTSTART;VALUE=DATE:20261016/);
  assert.match(text, /DTEND;VALUE=DATE:20261017/);
  assert.match(text, /STATUS:TENTATIVE/);
  assert.equal(
    await page.getByRole("heading", { name: "A glimpse of the atmosphere.", exact: true }).count(),
    0,
  );
  await visit(page, base, "/events/e33");
  await page.getByText(/Sun, 18 Oct/).waitFor();
  await page.getByText(/Sat, 17 Oct/).waitFor();
  captures.push(await capture(page, output, `${key}-multi-day-dates`));
  await visit(page, base, "/events/e35");
  assert.equal(
    await page.getByRole("button", { name: "RSVP closed", exact: true }).isDisabled(),
    true,
  );
  for (const [id, label] of [
    ["e5", "Fully booked"],
    ["e15", "Cancelled"],
    ["e16", "Event ended"],
  ]) {
    await visit(page, base, `/events/${id}`);
    assert.equal(await page.getByRole("button", { name: label, exact: true }).isDisabled(), true);
  }
  assert.ok(
    fixture.hits
      .filter((h) => h.path === "/api/events" && h.search.includes("page=1"))
      .every((h) => h.cookie === "campus_session=fixture-session-only"),
  );
  return captures;
}
