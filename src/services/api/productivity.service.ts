import { apiClient } from "@/services/api/client";

export const productivityService = {
  async listInitialTasks() {
    return (await apiClient<{ initialTasks: any[] }>("/productivity/timetable.json")).initialTasks;
  },
  async listTimetableSessions() {
    return (await apiClient<{ timetableSessions: any[] }>("/productivity/timetable.json")).timetableSessions;
  },
};
