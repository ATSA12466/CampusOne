export type StudyDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";
export interface StudyPlannerInput {
  subject: string;
  weekStart: string;
  days: StudyDay[];
  start: string;
  duration: "45" | "60" | "90";
  breakMinutes: "5" | "10" | "15";
  goal: "Revision" | "Practice" | "Mixed";
  constraints: string;
}
export interface StudySession {
  date: string;
  start: string;
  end: string;
  breakUntil: string;
  focus: string;
}
export interface StudyPlan extends StudyPlannerInput {
  id: string;
  createdAt: string;
  sessions: StudySession[];
}
