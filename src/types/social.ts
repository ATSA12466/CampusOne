export interface SocialPost {
  id: string;
  author: string;
  body: string;
  topic: string;
  createdAt: string;
  photo?: string;
}
export interface SocialReaction {
  id: string;
  postId: string;
  kind: "like" | "celebrate" | "useful";
}
export interface SocialReply {
  id: string;
  postId: string;
  parentId?: string;
  author: string;
  body: string;
  createdAt: string;
}
export interface SocialConcern {
  id: string;
  targetId: string;
  area: "community" | "messages";
  reason: "spam" | "harassment" | "privacy" | "other";
  note: string;
  createdAt: string;
}
export interface MessageRecord {
  id: string;
  conversationId: string;
  body: string;
  author: "you";
  createdAt: string;
  photo?: string;
}
export interface PrivateConversation {
  id: string;
  name: string;
  createdAt: string;
}
