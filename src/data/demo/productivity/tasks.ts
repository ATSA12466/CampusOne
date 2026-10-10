import type { TaskItem, TimetableSession } from "@/types";

export const initialTasks: TaskItem[] = [
  {
    id: "t1",
    title: "Submit software design assignment",
    description: "Upload final PDF to LMS",
    dueDate: "2026-10-10",
    completed: false,
    priority: "high",
    category: "academic",
  },
  {
    id: "t2",
    title: "Prepare club budget draft",
    dueDate: "2026-10-14",
    completed: false,
    priority: "medium",
    category: "club",
  },
];

export const timetableSessions: TimetableSession[] = [
  { id: "s1", day: "Monday", course: "ITT 341", start: "09:00", end: "11:00", venue: "Lab 2" },
  { id: "s2", day: "Tuesday", course: "ITT 315", start: "13:00", end: "15:00", venue: "B15" },
  { id: "s3", day: "Thursday", course: "ITT 351", start: "10:00", end: "12:00", venue: "N-Block" },
];
