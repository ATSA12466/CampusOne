import { apiClient } from "@/services/api/client";

export const communityService = {
  async listConversations() {
    return (await apiClient<{ conversations: any[] }>("/community/conversations.json")).conversations;
  },
  async listPosts() {
    return (await apiClient<{ posts: any[] }>("/community/conversations.json")).posts;
  },
  async listNotifications() {
    return (await apiClient<{ notifications: any[] }>("/community/conversations.json")).notifications;
  },
};
