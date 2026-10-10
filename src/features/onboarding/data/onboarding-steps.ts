import { BookOpen, Handshake, Megaphone, Sparkles, Users } from "lucide-react";

export const onboardingSteps = [
  {
    id: "welcome",
    title: "Welcome to CampusOne",
    description:
      "A unified student platform for academics, clubs, community, representation, and opportunities at GCTU.",
    icon: Sparkles,
    accent: "from-[var(--color-midnight-navy)] to-[var(--color-royal-blue)]",
  },
  {
    id: "academics",
    title: "Academic Success",
    description: "Stay organised with learning resources, tasks, timetable tools, and study assistance.",
    icon: BookOpen,
    accent: "from-blue-600 to-sky-500",
  },
  {
    id: "participation",
    title: "Student Participation",
    description: "Discover clubs, track participation, attend events, and earn transparent recognition.",
    icon: Handshake,
    accent: "from-emerald-700 to-teal-500",
  },
  {
    id: "representation",
    title: "Student Representation",
    description: "Access SRC projects, announcements, requests, and governance updates in one place.",
    icon: Megaphone,
    accent: "from-amber-500 to-yellow-400",
  },
  {
    id: "community",
    title: "Campus Community & Opportunities",
    description: "Connect with peers, explore opportunities, and discover student-focused resources.",
    icon: Users,
    accent: "from-violet-600 to-indigo-500",
  },
] as const;
