import assert from "node:assert/strict";
import { capture } from "./helpers.mjs";
export async function checkApiCancel(page, output, key, fixture) {
  const dialog = page.getByRole("dialog");
  await page.getByRole("button", { name: "Cancel RSVP", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Keep my RSVP", exact: true })
    .waitFor();
  fixture.state.holdMutationResponse = true;
  try {
    await dialog
      .getByRole("button", { name: "Cancel RSVP", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Stop waiting", exact: true })
      .waitFor();
    assert.equal(
      await dialog.getByRole("button", { name: "Cancelling…" }).isDisabled(),
      true,
    );
    assert.equal(
      await dialog
        .getByRole("button", { name: "Keep my RSVP", exact: true })
        .count(),
      0,
    );
    await dialog
      .getByText(
        /It cannot undo a cancellation already accepted by the service/,
      )
      .waitFor();
    // The publisher accepts DELETE but holds its acknowledgement. An aborted wait cannot roll it back.
    await page.waitForFunction(async () => {
      const response = await fetch("/api/events/activity", {
        credentials: "include",
      });
      const activity = await response.json();
      return !activity.goingIds.includes("e1");
    });
    const pending = await capture(
      page,
      output,
      `${key}-cancel-pending-not-rollback`,
    );
    await dialog
      .getByRole("button", { name: "Stop waiting", exact: true })
      .click();
    await dialog.waitFor({ state: "hidden" });
    assert.deepEqual(fixture.state.goingIds, []);
    assert.equal(
      await page.getByText("RSVP cancelled", { exact: true }).count(),
      0,
    );
    fixture.releaseMutationResponses();
    fixture.state.holdMutationResponse = false;
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "RSVP", exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "View ticket", exact: true })
        .count(),
      0,
    );
    return pending;
  } finally {
    fixture.state.holdMutationResponse = false;
    fixture.releaseMutationResponses();
  }
}
