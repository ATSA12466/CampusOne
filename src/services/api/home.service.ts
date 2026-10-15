import { apiClient } from "@/services/api/client";

export const homeService = {
  async listFeaturedContent() {
    return (await apiClient<{ featured: any[] }>("/home/featured.json")).featured;
  },
};
