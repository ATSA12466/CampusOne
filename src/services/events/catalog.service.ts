import { campusService } from "@/services";
import type { EventCatalog, EventDetailSnapshot } from "@/types";
import type { ServiceOptions } from "@/types/service-contracts";
const bounded = (input: ServiceOptions = {}) => ({
  ...input,
  signal: input.signal
    ? AbortSignal.any([input.signal, AbortSignal.timeout(8000)])
    : AbortSignal.timeout(8000),
});
export const eventCatalogService = {
  async list(page = 1, input: ServiceOptions = {}): Promise<EventCatalog> {
    const now = new Date().toISOString();
    try {
      const result = await campusService.list("events", { ...bounded(input), page, pageSize: 30 });
      if (result.items.length > 30)
        throw new Error("The event service returned too many records. Please retry.");
      return { page: result, error: null, now };
    } catch (error) {
      if (input.signal?.aborted) throw error;
      return {
        page: null,
        error: error instanceof Error ? error.message : "Events could not load. Please retry.",
        now,
      };
    }
  },
  async get(id: string, input: ServiceOptions = {}) {
    return campusService.get("events", id, bounded(input));
  },
  async read(id: string, input: ServiceOptions = {}): Promise<EventDetailSnapshot> {
    return { event: await this.get(id, input), now: new Date().toISOString() };
  },
};
