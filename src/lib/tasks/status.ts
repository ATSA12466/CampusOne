import type { TaskItem } from "@/types/productivity";
export const campusToday = (now = new Date()) => now.toISOString().slice(0, 10);
export const taskIsOverdue = (task: TaskItem, today = campusToday()) =>
  !task.completed && !!task.dueDate && task.dueDate < today;
