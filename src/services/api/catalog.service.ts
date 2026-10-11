import { apiEndpoints } from "@/config/api-endpoints";
import type {
  CatalogService,
  CollectionMap,
  CollectionName,
  ListQuery,
  Page,
  ServiceOptions,
} from "@/types/service-contracts";
import { listQuerySchema } from "@/services/validation/queries.schema";
import { entitySchemas, pageSchema } from "@/services/validation/catalog.schemas";
import { apiClient, ApiError } from "./client";

export function createApiCatalog(baseUrl?: string): CatalogService {
  return {
    async list<K extends CollectionName>(
      collection: K,
      query: ListQuery = {},
    ): Promise<Page<CollectionMap[K]>> {
      const parameters = listQuerySchema.parse(query);
      const search = new URLSearchParams(
        Object.entries(parameters).map(([key, value]) => [key, String(value)]),
      );
      return apiClient(`${apiEndpoints[collection]}?${search}`, {
        schema: pageSchema(entitySchemas[collection]),
        cache: "no-store",
        signal: query.signal,
        headers: query.headers,
        baseUrl,
      });
    },
    async get<K extends CollectionName>(
      collection: K,
      id: string,
      options: ServiceOptions = {},
    ): Promise<CollectionMap[K] | null> {
      if (!id || id.includes("/") || id.includes("..")) return null;
      try {
        return await apiClient(`${apiEndpoints[collection]}/${encodeURIComponent(id)}`, {
          schema: entitySchemas[collection],
          cache: "no-store",
          signal: options.signal,
          headers: options.headers,
          baseUrl,
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  };
}
