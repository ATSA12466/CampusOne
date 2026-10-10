import { appConfig } from "@/config/app-config";
import type { CatalogService } from "@/types/service-contracts";

// Legacy screens must not download API schemas or catalog code they don't use.
let selected: Promise<CatalogService> | null = null;
function catalog() {
  selected ??= (
    appConfig.dataSource === "api"
      ? import("./api/catalog.service").then(({ createApiCatalog }) => createApiCatalog())
      : import("./demo/catalog.service").then(({ demoCatalog }) => demoCatalog)
  ).catch((error: unknown) => {
    selected = null;
    throw error;
  });
  return selected;
}
export const campusService: CatalogService = {
  async list(collection, query) {
    return (await catalog()).list(collection, query);
  },
  async get(collection, id, options) {
    return (await catalog()).get(collection, id, options);
  },
};
// Compatibility exports are demo-only until individual feature migrations are complete.
export {
  academicsService,
  communityService,
  engagementService,
  homeService,
  lifeService,
  mediaService,
  productivityService,
} from "./demo";
export { demoAuthService } from "./auth/demo-auth.service";
