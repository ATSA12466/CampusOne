import { z } from "zod";
import { weekDays } from "./schedule.schema";
import { recordIdSchema } from "./owned-media.schema";
import { minutes, studySessions } from "@/lib/study/planner";
const clock = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Choose a valid time.");
export const studyInputSchema = z
  .object({
    subject: z.string().trim().min(2, "Name a subject.").max(100),
    weekStart: z.iso.date({ error: "Choose a real date." }),
    days: z
      .array(z.enum(weekDays))
      .min(1, "Choose at least one available day.")
      .max(7)
      .refine((v) => new Set(v).size === v.length),
    start: clock,
    duration: z.enum(["45", "60", "90"]),
    breakMinutes: z.enum(["5", "10", "15"]),
    goal: z.enum(["Revision", "Practice", "Mixed"]),
    constraints: z.string().trim().max(1000),
  })
  .refine(
    (v) =>
      minutes(v.start) + Number(v.duration) + Number(v.breakMinutes) < 1440,
    {
      path: ["start"],
      message:
        "Choose a start that leaves room for the session and break before midnight.",
    },
  );
export const studyPlanSchema = studyInputSchema
  .safeExtend({
    id: recordIdSchema,
    createdAt: z.iso.datetime(),
    sessions: z
      .array(
        z.object({
          date: z.iso.date(),
          start: clock,
          end: clock,
          breakUntil: clock,
          focus: z.enum(["Revision", "Practice", "Recall & reflect"]),
        }),
      )
      .min(1)
      .max(7),
  })
  .refine(
    (v) => JSON.stringify(v.sessions) === JSON.stringify(studySessions(v)),
    {
      path: ["sessions"],
      message:
        "The draft sessions do not match the stated availability and duration.",
    },
  );
