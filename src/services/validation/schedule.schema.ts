import { z } from "zod";
import { isCampusDate } from "@/lib/home/schedule";
export const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
const time = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Choose a valid time.");
export const sessionInputSchema = z
  .object({
    day: z.enum(weekDays),
    course: z.string().trim().min(2).max(100),
    start: time,
    end: time,
    venue: z.string().trim().min(2).max(120),
  })
  .refine((v) => v.end > v.start, {
    path: ["end"],
    message: "Finish after the start time.",
  });
export const planInputSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    date: z.string().refine(isCampusDate, "Choose a real date."),
    start: time,
    end: time,
    venue: z.string().trim().min(2).max(120),
  })
  .refine((v) => v.end > v.start, {
    path: ["end"],
    message: "Finish after the start time.",
  });
