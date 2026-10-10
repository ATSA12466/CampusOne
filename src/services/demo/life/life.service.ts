import { accommodations, marketplaceListings, reports } from "@/data/demo/housing/life";

export const lifeService = {
  listMarketplace: () => marketplaceListings,
  listLostFound: () => reports,
  listAccommodation: () => accommodations,
};
