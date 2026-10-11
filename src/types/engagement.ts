import type { ClubDetails } from "./clubs";
export interface Club {
  id: string;
  name: string;
  category: string;
  description: string;
  cover: string;
  objectives: string[];
  details?: ClubDetails;
}

export interface ClubMembership {
  id: string;
  clubId: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  applicantName?: string;
  note?: string;
  requestedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: "src" | "campus" | "club";
  pinned: boolean;
  publishedAt: string;
}

export interface EventItem {
  id: string;
  title: string;
  venue: string;
  date: string;
  category: string;
  seats: number;
  registered: number;
}

export interface Opportunity {
  id: string;
  title: string;
  provider: string;
  category: string;
  deadline: string;
  summary: string;
}

export interface Campaign {
  id: string;
  title: string;
  advertiser: string;
  placement: string;
  status: "draft" | "active" | "scheduled";
  startDate: string;
  endDate: string;
}

export interface Representative {
  id: string;
  name: string;
  role: string;
  responsibility: string;
}

export interface SRCProject {
  id: string;
  title: string;
  status: "planning" | "active" | "in-progress" | "completed";
  summary: string;
}

export interface StudentRequest {
  id: string;
  title: string;
  category: "Academic support" | "Welfare" | "Infrastructure";
  description: string;
  status: "submitted" | "under-review" | "resolved";
  createdAt: string;
}
