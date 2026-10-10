import type { NavGroup } from "@/types/navigation";

export const exploreGroup = {
  id: "explore",
  label: "Explore campus",
  destinations: [
    {
      label: "Home",
      href: "/home",
      icon: "home",
      description: "Your day, your people and what's happening.",
    },
    {
      label: "Discover",
      href: "/discover",
      icon: "compass",
      description: "Find a new corner of campus.",
    },
    {
      label: "Clubs",
      href: "/clubs",
      icon: "clubs",
      description: "Find your people and manage membership.",
      keywords: "societies associations executives",
    },
    {
      label: "Events",
      href: "/events",
      icon: "events",
      description: "Meet-ups, campus events and your tickets.",
      keywords: "rsvp qr register",
    },
    {
      label: "Community",
      href: "/community",
      icon: "community",
      description: "Conversations with your campus community.",
      keywords: "posts social feed",
    },
  ],
} as const satisfies NavGroup;

export const lifeGroup = {
  id: "life",
  label: "Campus life",
  destinations: [
    {
      label: "Accommodation",
      href: "/accommodation",
      icon: "housing",
      description: "Hostels and student accommodation.",
      keywords: "housing rooms rent",
    },
    {
      label: "Marketplace",
      href: "/marketplace",
      icon: "market",
      description: "Student listings and useful finds.",
      keywords: "shop buy sell",
    },
    {
      label: "Lost & found",
      href: "/lost-and-found",
      icon: "lostFound",
      description: "Report an item or help it get home.",
    },
    {
      label: "Opportunities",
      href: "/opportunities",
      icon: "opportunities",
      description: "Internships, scholarships and growth.",
    },
    {
      label: "SRC Office",
      href: "/src-office",
      icon: "council",
      description: "Demo council projects and student requests.",
      keywords: "welfare representatives support",
    },
    {
      label: "Announcements",
      href: "/announcements",
      icon: "announcements",
      description: "Campus and community updates.",
      keywords: "news notices",
    },
  ],
} as const satisfies NavGroup;
