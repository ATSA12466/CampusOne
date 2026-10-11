"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
const minute = (timestamp: number) => Math.floor(timestamp / 60000) * 60000;
const Clock = createContext<Date | null>(null);
export function HomeClockProvider({
  initialNow,
  children,
}: {
  initialNow: string;
  children: ReactNode;
}) {
  const [timestamp, setTimestamp] = useState(() => minute(Date.parse(initialNow)));
  useEffect(() => {
    const update = () => setTimestamp(minute(Date.now()));
    update();
    const timer = window.setInterval(update, 60000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const now = useMemo(() => new Date(timestamp), [timestamp]);
  return <Clock.Provider value={now}>{children}</Clock.Provider>;
}
export function useHomeClock() {
  const now = useContext(Clock);
  if (!now) throw new Error("Home clock must be inside its provider");
  return now;
}
