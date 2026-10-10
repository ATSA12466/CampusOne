import type { CommunityReadService } from "@/types/service-contracts";
import { communityPosts, conversations, notifications } from "@/data/demo/community/social";

export const communityService = {
  listPosts: () => communityPosts,
  listNotifications: () => notifications,
  listConversations: () => conversations,
} satisfies CommunityReadService;
