import type { StudyPlannerInput, StudySession } from "@/types/study-planner";
export const minutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const time = (value: number) =>
  `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export function studySessions(input: StudyPlannerInput): StudySession[] {
  const result: StudySession[] = [];
  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(`${input.weekStart}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    if (!input.days.some((day) => day === days[date.getUTCDay()])) continue;
    const focuses = ["Revision", "Practice", "Recall & reflect"];
    result.push({
      date: date.toISOString().slice(0, 10),
      start: input.start,
      end: time(minutes(input.start) + Number(input.duration)),
      breakUntil: time(
        minutes(input.start) +
          Number(input.duration) +
          Number(input.breakMinutes),
      ),
      focus:
        input.goal === "Mixed"
          ? focuses[result.length % focuses.length]
          : input.goal,
    });
  }
  return result;
}
export function nextStudyWeek(now = new Date()): string {
  const result = new Date(now);
  result.setUTCDate(result.getUTCDate() + ((8 - result.getUTCDay()) % 7));
  return result.toISOString().slice(0, 10);
}
