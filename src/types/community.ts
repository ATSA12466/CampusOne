export interface CommunityPost {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  likes: number;
  comments: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  href: string;
  read: boolean;
  category: "tasks" | "events" | "clubs" | "announcement";
}

export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  updatedAt: string;
}
