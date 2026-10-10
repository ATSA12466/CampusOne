import type { LifeReadService } from "@/types/service-contracts";
import { accommodations, marketplaceListings, reports } from "@/data/demo/housing/life";

export const lifeService = {
  listMarketplace: () => marketplaceListings,
  listLostFound: () => reports,
  listAccommodation: () => accommodations,
} satisfies LifeReadService;
