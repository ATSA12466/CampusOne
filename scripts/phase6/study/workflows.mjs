import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { capture, visit } from "../events/helpers.mjs";
export async function studyWorkflows(page, base, out, key, captures) {
  const snap = async (name) =>
    captures.push(await capture(page, out, `${key}-${name}`));
  await visit(page, base, "/tasks");
  await page.getByLabel("Task title", { exact: true }).fill("x");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  assert.equal(
    await page
      .getByLabel("Task title", { exact: true })
      .getAttribute("aria-invalid"),
    "true",
  );
  await snap("task-validation");
  await page
    .getByLabel("Task title", { exact: true })
    .fill("Acceptance study task");
  await page
    .getByLabel("Task description", { exact: true })
    .fill("Prepare a few useful questions for my study circle.");
  await page.getByLabel("Task due date", { exact: true }).fill("2026-10-20");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  let card = page
    .locator("[data-task-id]")
    .filter({ hasText: "Acceptance study task" });
  await card.waitFor();
  await snap("task-created");
  await card.getByRole("button", { name: "Complete", exact: true }).click();
  await card.getByRole("button", { name: "Reopen", exact: true }).waitFor();
  await card.getByRole("button", { name: "Edit", exact: true }).click();
  await page
    .getByLabel("Task title", { exact: true })
    .fill("Edited acceptance task");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  card = page
    .locator("[data-task-id]")
    .filter({ hasText: "Edited acceptance task" });
  await card.waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await card.getByRole("button", { name: "Reopen", exact: true }).waitFor();
  await snap("task-edited-completed-reload");
  await card.getByRole("button", { name: "Delete", exact: true }).click();
  await card.waitFor({ state: "detached" });
  await page
    .getByLabel("Search tasks", { exact: true })
    .fill("no-matching-task-xyz");
  await page.getByText("No tasks found", { exact: true }).waitFor();
  await snap("task-empty");
  await visit(page, base, "/study-assistant");
  await page.getByLabel("Priority subject", { exact: true }).fill("x");
  await page
    .getByRole("button", { name: "Generate study draft", exact: true })
    .click();
  assert.equal(
    await page
      .getByLabel("Priority subject", { exact: true })
      .getAttribute("aria-invalid"),
    "true",
  );
  await snap("study-validation");
  await page
    .getByLabel("Priority subject", { exact: true })
    .fill("Software quality practice");
  await page.getByLabel("Week starting", { exact: true }).fill("2026-10-12");
  await page.getByLabel("Session start time", { exact: true }).fill("19:00");
  await page
    .getByLabel("Preferred session duration", { exact: true })
    .selectOption("60");
  await page
    .getByLabel("Break after each session", { exact: true })
    .selectOption("15");
  await page.getByRole("checkbox", { name: "Friday", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: "Tuesday", exact: true }).check();
  await page
    .getByLabel("Constraints and reminders", { exact: true })
    .fill("No Friday sessions; bring practice questions.");
  await page
    .getByRole("button", { name: "Generate study draft", exact: true })
    .click();
  const plan = page.locator("[data-study-plan]").first();
  await plan
    .getByRole("heading", { name: "Software quality practice", exact: true })
    .waitFor();
  assert.equal(await plan.locator("ol li").count(), 3);
  assert.equal(
    await plan.getByText("19:00–20:00 · Practice", { exact: true }).count(),
    1,
  );
  assert.equal(
    await plan
      .getByText("Break until 20:15 · Africa/Accra", { exact: true })
      .count(),
    3,
  );
  await plan
    .getByText("No Friday sessions; bring practice questions.", { exact: true })
    .waitFor();
  assert.ok(!(await plan.innerText().then((t) => t.includes("Friday, 16"))));
  await snap("study-controls-honoured");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    plan
      .getByRole("button", {
        name: "Export shown schedule (.ics)",
        exact: true,
      })
      .click(),
  ]);
  const content = await readFile(await download.path(), "utf8");
  assert.equal(content.match(/BEGIN:VEVENT/g).length, 3);
  assert.ok(content.includes("DTSTART:20261012T190000Z"));
  assert.ok(content.includes("DTEND:20261012T200000Z"));
  await plan
    .getByRole("button", { name: "Save study draft", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Your saved drafts (1)", exact: true })
    .waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByRole("heading", { name: "Your saved drafts (1)", exact: true })
    .waitFor();
  await page
    .locator("[data-study-plan]")
    .getByText("No Friday sessions; bring practice questions.", { exact: true })
    .waitFor();
  await snap("study-saved-reload");
  await page
    .getByRole("button", { name: "Delete saved draft", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Your saved drafts (0)", exact: true })
    .waitFor();
}
