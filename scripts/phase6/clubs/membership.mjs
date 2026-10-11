import assert from "node:assert/strict";
import {
  authContext,
  visit,
  capture,
  focusIs,
  checkTrap,
  stored,
  requestJoin,
  trackErrors,
  roleSwitch,
} from "./helpers.mjs";
export async function membershipChecks(browser, base, output) {
  const captures = [];
  for (const width of [360, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-membership`;
      try {
        await visit(page, base, "/clubs/club-3");
        const trigger = page.getByRole("button", { name: "Request to join", exact: true });
        await trigger.focus();
        await trigger.press("Enter");
        const dialog = page.getByRole("dialog");
        await dialog.waitFor();
        await checkTrap(page, dialog);
        await dialog
          .getByRole("button", { name: "Submit membership request", exact: true })
          .click();
        await dialog
          .getByText("Please acknowledge where this request will be saved.", { exact: true })
          .waitFor();
        await focusIs(page, dialog.getByRole("checkbox"));
        captures.push(await capture(page, output, `${key}-ack-required`));
        const note = dialog.getByLabel("A little introduction (optional)");
        await note.fill("x".repeat(401));
        await dialog.getByRole("checkbox").check();
        await dialog
          .getByRole("button", { name: "Submit membership request", exact: true })
          .click();
        await focusIs(page, note);
        await dialog
          .getByText("Keep your introduction to 400 characters or fewer.", { exact: true })
          .waitFor();
        captures.push(await capture(page, output, `${key}-note-validation`));
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden" });
        await focusIs(page, trigger);
        await requestJoin(page, "A curious local demo introduction.");
        assert.equal(
          (await stored(page, "campusone-app")).memberships.filter((m) => m.clubId === "club-3")
            .length,
          1,
        );
        captures.push(await capture(page, output, `${key}-pending`));
        await page.reload({ waitUntil: "networkidle" });
        await page.getByText("Membership: pending", { exact: true }).waitFor();
        const withdraw = page.getByRole("button", { name: "Withdraw request", exact: true });
        await withdraw.click();
        await dialog.waitFor();
        await checkTrap(page, dialog);
        await dialog.getByRole("button", { name: "Keep it", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
        await focusIs(page, withdraw);
        await withdraw.click();
        captures.push(await capture(page, output, `${key}-withdraw-confirm`));
        await dialog.getByRole("button", { name: "Withdraw request", exact: true }).click();
        await trigger.waitFor();
        assert.ok(
          !(await stored(page, "campusone-app")).memberships.some((m) => m.clubId === "club-3"),
        );
        const save = page.getByRole("button", { name: "Save Robotics Studio", exact: true });
        await save.click();
        await page
          .getByRole("button", { name: "Unsave Robotics Studio", exact: true })
          .waitFor();
        await page.reload({ waitUntil: "networkidle" });
        await page
          .getByRole("button", { name: "Unsave Robotics Studio", exact: true })
          .waitFor();
        await visit(page, base, "/clubs");
        await page.getByRole("button", { name: "Saved clubs", exact: true }).click();
        await page.getByRole("heading", { name: "Robotics Studio", exact: true }).waitFor();
        captures.push(await capture(page, output, `${key}-saved`));
        await page
          .getByRole("button", { name: "Unsave Robotics Studio", exact: true })
          .click();
        await page.getByText("Your next community is waiting.", { exact: true }).waitFor();
        await visit(page, base, "/clubs/club-1");
        await page.getByRole("button", { name: "Leave community", exact: true }).click();
        await dialog.getByRole("button", { name: "Leave community", exact: true }).click();
        await page.getByRole("button", { name: "Request to join", exact: true }).waitFor();
        await page.reload({ waitUntil: "networkidle" });
        await page.getByRole("button", { name: "Request to join", exact: true }).waitFor();
        assert.ok(
          !(await stored(page, "campusone-app")).memberships.some((m) => m.clubId === "club-1"),
        );
        await page
          .getByRole("button", { name: "View photo 1 of 3 in full screen", exact: true })
          .click();
        await dialog.waitFor();
        await checkTrap(page, dialog);
        await page.keyboard.press("ArrowRight");
        await dialog.getByText("Photo 2 of 3", { exact: true }).waitFor();
        captures.push(await capture(page, output, `${key}-gallery`));
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden" });
        await focusIs(
          page,
          page.getByRole("button", { name: "View photo 1 of 3 in full screen", exact: true }),
        );
        assert.deepEqual(errors, []);
        console.log("Membership/save/gallery", width, theme, "passed");
      } finally {
        await context.close();
      }
    }
  return {
    captures,
    requestWithdrawLeavePersist: true,
    saveRemovePersist: true,
    validationAndFocus: true,
    galleryKeyboard: true,
  };
}
export async function executiveChecks(browser, base, output) {
  const captures = [];
  for (const width of [360, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-executive`;
      try {
        await visit(page, base, "/clubs/club-3");
        await requestJoin(page, "Demo executive review introduction.");
        await roleSwitch(page, base, "club-executive");
        const panel = page.locator("#executive-reviews");
        await panel
          .getByRole("heading", { name: "Club executive demo panel", exact: true })
          .waitFor();
        captures.push(await capture(page, output, `${key}-pending`));
        const debate = panel.getByRole("group", {
          name: "Membership request for Debate Assembly",
          exact: true,
        });
        await debate.getByRole("button", { name: "Approve", exact: true }).click();
        await debate.waitFor({ state: "hidden" });
        const robotics = panel.getByRole("group", {
          name: "Membership request for Robotics Studio",
          exact: true,
        });
        await robotics.getByRole("button", { name: "Reject", exact: true }).click();
        await robotics.waitFor({ state: "hidden" });
        await panel.getByText("No pending requests right now.", { exact: true }).waitFor();
        captures.push(await capture(page, output, `${key}-reviewed`));
        await page.reload({ waitUntil: "networkidle" });
        const data = await stored(page, "campusone-app");
        assert.equal(data.memberships.find((m) => m.id === "m2").status, "approved");
        const rejected = data.memberships.find((m) => m.clubId === "club-3");
        assert.equal(rejected.status, "rejected");
        await roleSwitch(page, base, "student");
        assert.equal(await page.locator("#executive-reviews").count(), 0);
        await visit(page, base, "/clubs/club-3");
        await page.getByRole("button", { name: "Request again", exact: true }).waitFor();
        captures.push(await capture(page, output, `${key}-rejected`));
        await requestJoin(page, "A new demo introduction.");
        assert.equal(
          (await stored(page, "campusone-app")).memberships.find((m) => m.clubId === "club-3").id,
          rejected.id,
        );
        assert.deepEqual(errors, []);
        console.log("Executive approve/reject/reapply", width, theme, "passed");
      } finally {
        await context.close();
      }
    }
  return {
    captures,
    executiveApproveRejectPersist: true,
    reapplySameRecord: true,
    studentPanelHidden: true,
  };
}
