import type { ServiceOptions } from "@/types/service-contracts";
import { campusService } from "@/services";
import type { ClubCatalog } from "@/types";
function options(input: ServiceOptions = {}) {
  return {
    ...input,
    signal: input.signal
      ? AbortSignal.any([input.signal, AbortSignal.timeout(8000)])
      : AbortSignal.timeout(8000),
  };
}
export const clubCatalogService = {
  async list(page = 1, input: ServiceOptions = {}): Promise<ClubCatalog> {
    try {
      return {
        page: await campusService.list("clubs", { ...options(input), page, pageSize: 30 }),
        error: null,
      };
    } catch (error) {
      if (input.signal?.aborted) throw error;
      return {
        page: null,
        error: error instanceof Error ? error.message : "Clubs could not be loaded. Please retry.",
      };
    }
  },
  async get(id: string, input: ServiceOptions = {}) {
    return campusService.get("clubs", id, options(input));
  },
};
