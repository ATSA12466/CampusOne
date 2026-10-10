import { images } from "@/config/images";
import type { Announcement, Campaign, Club, ClubMembership, EventItem, Opportunity } from "@/types";

export const clubs: Club[] = [
  {
    id: "club-1",
    name: "Code Collective",
    category: "Technology",
    description: "Peer coding sessions, hackathons, and product showcases.",
    cover: images.clubCode.src,
    objectives: ["Build practical projects", "Mentor freshers", "Host coding events"],
  },
  {
    id: "club-2",
    name: "Debate Assembly",
    category: "Public Speaking",
    description: "Weekly debate and communication mastery workshops.",
    cover: images.clubDebate.src,
    objectives: ["Critical thinking", "Confident public speaking"],
  },
];

export const memberships: ClubMembership[] = [
  { id: "m1", clubId: "club-1", userId: "user-1", status: "approved" },
  { id: "m2", clubId: "club-2", userId: "user-1", status: "pending" },
];

export const announcements: Announcement[] = [
  {
    id: "a1",
    title: "SRC study space extension approved",
    content: "Study commons now open till 10pm during exams.",
    category: "src",
    pinned: true,
    publishedAt: "2026-10-08",
  },
  {
    id: "a2",
    title: "Club fair this Friday",
    content: "Discover 30+ clubs at the innovation square.",
    category: "campus",
    pinned: false,
    publishedAt: "2026-10-07",
  },
];

export const events: EventItem[] = [
  {
    id: "e1",
    title: "Innovation Night",
    venue: "Main Auditorium",
    date: "2026-10-16",
    category: "Showcase",
    seats: 300,
    registered: 120,
  },
  {
    id: "e2",
    title: "Data Science Career Talk",
    venue: "Seminar Hall A",
    date: "2026-10-20",
    category: "Career",
    seats: 180,
    registered: 86,
  },
];

export const opportunities: Opportunity[] = [
  {
    id: "o1",
    title: "MTN Summer Internship",
    provider: "MTN Ghana",
    category: "Internship",
    deadline: "2026-11-01",
    summary: "Hands-on telecom software operations internship.",
  },
  {
    id: "o2",
    title: "Women in Tech Scholarship",
    provider: "TechBridge Africa",
    category: "Scholarship",
    deadline: "2026-10-28",
    summary: "Tuition support for outstanding women in STEM.",
  },
];

export const campaigns: Campaign[] = [
  {
    id: "ad1",
    title: "Study Plan Pro",
    advertiser: "Demo Campus Partner",
    placement: "Home Carousel",
    status: "active",
    startDate: "2026-10-01",
    endDate: "2026-12-31",
  },
];
