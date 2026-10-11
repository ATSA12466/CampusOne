import {extraAnnouncements} from "./announcement-catalog";
import { extraOpportunities, opportunityDetails } from "./opportunity-catalog";
import type { Announcement, Campaign, Opportunity } from "@/types";

export { clubs } from "./club-catalog";
export { memberships } from "./membership-seeds";

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
  ...extraAnnouncements,
];

export { events } from "./event-catalog";

export const opportunities: Opportunity[] = [
  {
    id: "o1",
    details: opportunityDetails("MTN Summer Internship", "Internship"),
    title: "MTN Summer Internship",
    provider: "MTN Ghana",
    category: "Internship",
    deadline: "2026-11-01",
    summary: "Hands-on telecom software operations internship.",
  },
  {
    id: "o2",
    details: opportunityDetails("Women in Tech Scholarship", "Scholarship"),
    title: "Women in Tech Scholarship",
    provider: "TechBridge Africa",
    category: "Scholarship",
    deadline: "2026-10-28",
    summary: "Tuition support for outstanding women in STEM.",
  },
  ...extraOpportunities,
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
