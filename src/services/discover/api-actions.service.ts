import { apiClient } from "../api/client";
import {
  discoverActivitySchema,
  discoverAckSchema,
  discoverReferenceSchema,
} from "../validation/discover.schema";
import type { DiscoverActionService } from "@/types/discover";
import type { ServiceOptions } from "@/types/service-contracts";
const options = (input: ServiceOptions = {}) => ({
  headers: input.headers,
  cache: "no-store" as const,
  signal: input.signal
    ? AbortSignal.any([input.signal, AbortSignal.timeout(10000)])
    : AbortSignal.timeout(10000),
});
export const apiDiscoverActions: DiscoverActionService = {
  source: "api",
  async activity(input) {
    return apiClient("/discover/activity", {
      ...options(input),
      schema: discoverActivitySchema,
    });
  },
  async save(input, saved, request) {
    const { category, id } = discoverReferenceSchema.parse(input);
    await apiClient(`/discover/${category}/${encodeURIComponent(id)}/saved`, {
      ...options(request),
      method: saved ? "PUT" : "DELETE",
      schema: discoverAckSchema,
    });
    return { persisted: true };
  },
};
