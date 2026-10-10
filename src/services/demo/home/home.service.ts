import type { HomeReadService } from "@/types/service-contracts";
import { featuredContent } from "@/data/demo/home/featured";

export const homeService = {
  listFeaturedContent: () => featuredContent.filter((item) => item.active),
} satisfies HomeReadService;
