import { discoverLabels } from "@/config/discover";
import { discoverReferenceSchema } from "../validation/discover.schema";
import { discoverSources } from "./catalog-sources";
import type { CatalogService, ServiceOptions } from "@/types/service-contracts";
import type { DiscoverCatalogService } from "@/types/discover";
const bounded = (input: ServiceOptions = {}, deadline = 8000) => ({
  ...input,
  signal: input.signal
    ? AbortSignal.any([input.signal, AbortSignal.timeout(deadline)])
    : AbortSignal.timeout(deadline),
});
export function createDiscoverCatalog(
  catalog: CatalogService,
  deadline = 8000,
): DiscoverCatalogService {
  const sources = discoverSources(catalog);
  const section: DiscoverCatalogService["section"] = async (
    category,
    page = 1,
    input = {},
  ) => {
    input.signal?.throwIfAborted();
    const source = sources.find((item) => item.category === category);
    if (!source || !Number.isSafeInteger(page) || page < 1)
      throw new Error("Invalid discovery source or page.");
    try {
      const result = await source.list(page, bounded(input, deadline));
      input.signal?.throwIfAborted();
      return { category, page: result, error: null };
    } catch (cause) {
      if (input.signal?.aborted) throw cause;
      return {
        category,
        page: null,
        error:
          cause instanceof Error && cause.name !== "ZodError"
            ? cause.message
            : `${discoverLabels[category]} returned an unexpected listing. Please retry.`,
      };
    }
  };
  return {
    section,
    async snapshot(input = {}) {
      input.signal?.throwIfAborted();
      const sections = await Promise.all(
        sources.map((source) => section(source.category, 1, input)),
      );
      input.signal?.throwIfAborted();
      return { sections, now: new Date().toISOString() };
    },
    async get(reference, input = {}) {
      const { category, id } = discoverReferenceSchema.parse(reference);
      input.signal?.throwIfAborted();
      const result = await sources
        .find((source) => source.category === category)!
        .get(id, bounded(input, deadline));
      input.signal?.throwIfAborted();
      return result;
    },
  };
}
