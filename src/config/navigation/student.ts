import type { NavGroup } from "@/types/navigation";

export const studyGroup = {
  id: "study",
  label: "Study & plan",
  destinations: [
    {
      label: "Academics",
      href: "/academics",
      icon: "academics",
      description: "Courses, notes and learning resources.",
      keywords: "lms pdf grades",
    },
    {
      label: "Timetable",
      href: "/timetable",
      icon: "timetable",
      description: "Your class schedule and venues.",
    },
    {
      label: "Calendar",
      href: "/calendar",
      icon: "calendar",
      description: "Classes and events in one view.",
    },
    {
      label: "Tasks",
      href: "/tasks",
      icon: "tasks",
      description: "A little progress, one task at a time.",
      keywords: "assignments due todo",
    },
    {
      label: "Study assistant",
      href: "/study-assistant",
      icon: "study",
      description: "A labelled demo study-plan helper.",
      keywords: "ai revision notes",
    },
  ],
} as const satisfies NavGroup;

export const workspaceGroup = {
  id: "workspace",
  label: "Your space",
  destinations: [
    {
      label: "Messages",
      href: "/messages",
      icon: "messages",
      description: "Your demo conversations and group chats.",
    },
    {
      label: "Notifications",
      href: "/notifications",
      icon: "notifications",
      description: "Updates you haven't caught up with yet.",
    },
    {
      label: "Participation",
      href: "/participation",
      icon: "participation",
      description: "Membership, activity and demo recognition.",
    },
    {
      label: "Media",
      href: "/media",
      icon: "media",
      description: "Podcasts and campus media.",
    },
    {
      label: "Profile",
      href: "/profile",
      icon: "profile",
      description: "Your student identity and saved activity.",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: "settings",
      description: "Appearance and your demo account.",
    },
  ],
} as const satisfies NavGroup;

export const toolsGroup = {
  id: "tools",
  label: "Campus tools · demo",
  destinations: [
    {
      label: "Management",
      href: "/management",
      icon: "management",
      description: "Role-preview management tools, not server authorization.",
    },
    {
      label: "Advertising",
      href: "/advertising",
      icon: "advertising",
      description: "Demo placements and campus campaigns.",
    },
  ],
} as const satisfies NavGroup;
