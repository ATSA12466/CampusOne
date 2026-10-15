import { apiClient } from "@/services/api/client";

export const lifeService = {
  async listMarketplace() {
    return (await apiClient<{ marketplaceListings: any[] }>("/life/marketplace.json")).marketplaceListings;
  },
  async listAccommodation() {
    return (await apiClient<{ accommodations: any[] }>("/life/marketplace.json")).accommodations;
  },
  async listLostFound() {
    return (await apiClient<{ reports: any[] }>("/life/marketplace.json")).reports;
  },
};
