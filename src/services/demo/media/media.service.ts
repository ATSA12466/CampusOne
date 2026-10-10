import type { MediaReadService } from "@/types/service-contracts";
import { mediaItems } from "@/data/demo/media/items";

export const mediaService = {
  listMedia: () => mediaItems,
} satisfies MediaReadService;
