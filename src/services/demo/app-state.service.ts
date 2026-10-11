import { memberships } from "@/data/demo/engagement/clubs";
import { initialStudentRequests } from "@/data/demo/engagement/src-office";
import { notifications } from "@/data/demo/community/social";
import { initialTasks } from "@/data/demo/productivity/tasks";
import type { DemoAppStateService } from "@/types/service-contracts";
// Only persisted-state seed readers: the initial shell must not ship every
// compatibility catalog object just to initialize its local demo planner.
export const demoAppStateService: DemoAppStateService = {
  initial: () =>
    structuredClone({
      memberships,
      srcRequests: initialStudentRequests,
      notifications,
      tasks: initialTasks,
    }),
};
