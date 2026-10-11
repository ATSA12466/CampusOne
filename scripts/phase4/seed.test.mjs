import test from "node:test";
import assert from "node:assert/strict";
test("lean shell state seeds preserve executive membership/task/notification/request data and isolation", async () => {
  const { demoAppStateService } = await import("../../src/services/demo/app-state.service.ts");
  const { engagementService, communityService, productivityService } = await import(
    "../../src/services/demo/index.ts"
  );
  const seed = demoAppStateService.initial();
  assert.deepEqual(seed, {
    memberships: engagementService.listMemberships(),
    srcRequests: engagementService.listInitialStudentRequests(),
    tasks: productivityService.listInitialTasks(),
    notifications: communityService.listNotifications(),
  });
  seed.memberships[0].status = "rejected";
  seed.tasks[0].completed = true;
  assert.equal(demoAppStateService.initial().memberships[0].status, "approved");
  assert.equal(demoAppStateService.initial().tasks[0].completed, false);
});
