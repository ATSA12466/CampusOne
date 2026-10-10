import type { CommunityPost, Conversation, NotificationItem } from "@/types";

export const communityPosts: CommunityPost[] = [
  {
    id: "p1",
    author: "Kojo Mensah",
    body: "Anyone joining the weekend Python challenge?",
    createdAt: "2026-10-09T08:00:00.000Z",
    likes: 22,
    comments: 9,
  },
  {
    id: "p2",
    author: "Ama Nyarko",
    body: "Shared my exam prep checklist in Academics resources.",
    createdAt: "2026-10-08T11:20:00.000Z",
    likes: 12,
    comments: 5,
  },
];

export const notifications: NotificationItem[] = [
  {
    id: "n1",
    title: "Task due tomorrow",
    description: "Submit software design assignment",
    href: "/tasks",
    read: false,
    category: "tasks",
  },
  {
    id: "n2",
    title: "New campus announcement",
    description: "SRC study space extension approved",
    href: "/announcements",
    read: false,
    category: "announcement",
  },
];

export const conversations: Conversation[] = [
  {
    id: "c1",
    name: "Code Collective Executives",
    lastMessage: "Please review Saturday agenda.",
    updatedAt: "Today, 10:30 AM",
  },
  {
    id: "c2",
    name: "Class Reps - Level 300",
    lastMessage: "Survey closes at 5pm.",
    updatedAt: "Yesterday",
  },
];
