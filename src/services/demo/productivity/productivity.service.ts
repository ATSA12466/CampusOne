import type { ProductivityReadService } from "@/types/service-contracts";
import { initialTasks, timetableSessions } from "@/data/demo/productivity/tasks";

export const productivityService = {
  listInitialTasks: () => initialTasks,
  listTimetableSessions: () => timetableSessions,
} satisfies ProductivityReadService;
