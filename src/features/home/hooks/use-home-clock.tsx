"use client";
// Keep the established Home contract while sharing its minute/visibility clock with Events.
export {
  CampusClockProvider as HomeClockProvider,
  useCampusClock as useHomeClock,
} from "@/components/providers/campus-clock";
