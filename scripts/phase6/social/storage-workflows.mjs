import assert from "node:assert/strict";
import {
  authContext,
  capture,
  visit,
  trackErrors,
} from "../events/helpers.mjs";
export async function storageWorkflows(browser, base, out, captures) {
  const context = await authContext(browser, base, 360, "dark"),
    page = await context.newPage(),
    errors = trackErrors(page);
  try {
    await context.addInitScript(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (k.startsWith("campusone-workspace:"))
          throw new DOMException("Storage denied", "SecurityError");
        return original.call(this, k, v);
      };
    });
    await visit(page, base, "/community");
    await page
      .getByLabel("Community post", { exact: true })
      .fill("This private update survives for this visit only.");
    await page
      .getByRole("button", { name: "Post update", exact: true })
      .click();
    await page
      .getByText("This private update survives for this visit only.", {
        exact: true,
      })
      .waitFor();
    await page
      .getByRole("status")
      .filter({ hasText: "For this visit only" })
      .waitFor();
    captures.push(await capture(page, out, "denied-storage-visit-only"));
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
  const corrupt = await authContext(browser, base, 1280, "light"),
    other = await corrupt.newPage();
  try {
    await visit(other, base, "/community");
    await other
      .getByLabel("Community post", { exact: true })
      .fill("Prepare a durable record for the corrupt-storage recovery test.");
    await other
      .getByRole("button", { name: "Post update", exact: true })
      .click();
    await other
      .getByText(
        "Prepare a durable record for the corrupt-storage recovery test.",
        { exact: true },
      )
      .waitFor();
    await other.evaluate(() => {
      const key = Object.keys(localStorage).find((k) =>
        k.endsWith(":communityPosts"),
      );
      localStorage.setItem(key, "damaged JSON");
    });
    await other.reload({ waitUntil: "networkidle" });
    await other
      .getByRole("alert")
      .filter({ hasText: "Saved device data is damaged" })
      .waitFor();
    captures.push(await capture(other, out, "corrupt-storage-recovery"));
  } finally {
    await corrupt.close();
  }
}
