import assert from "node:assert/strict";
import { capture, visit } from "../events/helpers.mjs";
export async function photo(page) {
  await page.getByRole("button", { name: "Add photo", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .locator("input[type=file]")
    .setInputFiles("public/images/demo/student-kojo.webp");
  await dialog
    .getByRole("button", { name: "Use this photo", exact: true })
    .click();
  await dialog.waitFor({ state: "detached" });
}
export async function socialWorkflows(page, base, out, key, captures) {
  const snap = async (name) =>
    captures.push(await capture(page, out, `${key}-${name}`));
  await visit(page, base, "/community");
  await page.getByLabel("Community post", { exact: true }).fill("x");
  await page.getByRole("button", { name: "Post update", exact: true }).click();
  assert.equal(
    await page
      .getByLabel("Community post", { exact: true })
      .getAttribute("aria-invalid"),
    "true",
  );
  await snap("community-validation");
  const body = "Private social acceptance post with an owned photograph.";
  await page.getByLabel("Community post", { exact: true }).fill(body);
  await photo(page);
  await page.getByRole("button", { name: "Post update", exact: true }).click();
  const post = page.locator("article[data-post-id]").filter({ hasText: body });
  await post.waitFor();
  assert.equal(
    await page.getByLabel("Community post", { exact: true }).inputValue(),
    "",
  );
  await page.reload({ waitUntil: "networkidle" });
  await post.waitFor();
  await snap("community-photo-reload");
  const like = post.getByRole("button", { name: /Like post/ });
  await like.click();
  await page.waitForFunction(() =>
    document.querySelector('article[data-post-id] button[aria-pressed="true"]'),
  );
  await like.click();
  await page.waitForFunction(
    () =>
      !document.querySelector(
        'article[data-post-id] button[aria-pressed="true"]',
      ),
  );
  await post.getByRole("button", { name: /Replies/ }).click();
  let dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Your reply", { exact: true })
    .fill("A useful private reply.");
  await dialog
    .getByRole("button", { name: "Save private reply", exact: true })
    .click();
  await dialog.getByText("A useful private reply.", { exact: true }).waitFor();
  await dialog
    .getByRole("button", { name: /Reply to / })
    .first()
    .click();
  await dialog
    .getByLabel("Your reply", { exact: true })
    .fill("A nested private reply.");
  await dialog
    .getByRole("button", { name: "Save private reply", exact: true })
    .click();
  await dialog.getByText("A nested private reply.", { exact: true }).waitFor();
  await snap("community-nested-replies");
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await post.getByRole("button", { name: "Save concern", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Why are you concerned?", { exact: true })
    .fill("This is a private acceptance-test concern draft.");
  await dialog
    .getByRole("button", { name: "Save concern draft", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  const keyStored = await page.evaluate(() =>
    Object.keys(localStorage).find((k) => k.endsWith(":communityPosts")),
  );
  const other = await page.context().newPage();
  await other.goto(base + "/community", { waitUntil: "networkidle" });
  await other.evaluate((k) => localStorage.removeItem(k), keyStored);
  await post.waitFor({ state: "detached" });
  await other.close();
  await page.getByLabel("Search community posts").fill("no-matching-story-xyz");
  await page
    .getByText("A little quiet in this view.", { exact: true })
    .waitFor();
  await snap("community-empty");
  await visit(page, base, "/messages");
  await page
    .getByRole("button", { name: "Start a conversation", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Conversation name", { exact: true })
    .fill("Acceptance study circle");
  await dialog
    .getByRole("button", { name: "Create private thread", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  await page
    .getByRole("heading", { name: "Acceptance study circle", exact: true })
    .waitFor();
  await photo(page);
  await page
    .getByLabel("Message draft", { exact: true })
    .fill("A privately saved message with an owned photograph.");
  await page
    .getByRole("button", { name: "Save private message", exact: true })
    .click();
  await page
    .getByLabel("Conversation history")
    .getByText("A privately saved message with an owned photograph.", {
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page.getByLabel("Message draft", { exact: true }).inputValue(),
    "",
  );
  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByLabel("Conversation history")
    .getByText("A privately saved message with an owned photograph.", {
      exact: true,
    })
    .waitFor();
  await snap("messages-photo-reload");
  await visit(page, base, "/notifications");
  await page
    .getByRole("button", { name: "Mark as read", exact: true })
    .first()
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Read state saved" })
    .waitFor();
  await page
    .getByRole("button", { name: "Mark all as read", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "0 unread updates", exact: true })
    .waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByRole("heading", { name: "0 unread updates", exact: true })
    .waitFor();
  await page.getByLabel("Filter notifications").selectOption("unread");
  await page.getByText("All quiet in this view.", { exact: true }).waitFor();
  await snap("notifications-read-all-reload");
}
