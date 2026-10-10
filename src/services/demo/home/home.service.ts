import { featuredContent } from "@/data/demo/home/featured";

export const homeService = {
  listFeaturedContent: () => featuredContent.filter((item) => item.active),
};
