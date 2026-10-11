import type { TimetableSession, EventItem } from "@/types";
export interface PersonalPlan {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  venue: string;
}
export interface ScheduleSnapshot {
  sessions: TimetableSession[];
  events: EventItem[];
  errors: string[];
  now: string;
  source: "demo" | "api";
}
export interface AgendaItem {
  id: string;
  title: string;
  date: string;
  start?: string;
  end?: string;
  venue: string;
  kind: "class" | "event" | "personal";
  label: string;
  href?: string;
  startsAt?: string;
  endsAt?: string;
  cancelled?: boolean;
}
