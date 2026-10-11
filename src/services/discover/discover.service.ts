import { appConfig } from "@/config/app-config";
import { campusService } from "@/services";
import type {
  DiscoverActionService,
  DiscoverCatalogService,
} from "@/types/discover";
let catalog: Promise<DiscoverCatalogService> | null = null;
const read = () =>
  (catalog ??= import("./catalog.service")
    .then(({ createDiscoverCatalog }) => createDiscoverCatalog(campusService))
    .catch((cause: unknown) => {
      catalog = null;
      throw cause;
    }));
export const discoverCatalogService: DiscoverCatalogService = {
  async snapshot(options) {
    return (await read()).snapshot(options);
  },
  async section(category, page, options) {
    return (await read()).section(category, page, options);
  },
  async get(reference, options) {
    return (await read()).get(reference, options);
  },
};
let actions: Promise<DiscoverActionService> | null = null;
const action = () =>
  (actions ??= (
    appConfig.dataSource === "demo"
      ? import("./demo-actions.service").then(
          ({ demoDiscoverActions }) => demoDiscoverActions,
        )
      : import("./api-actions.service").then(
          ({ apiDiscoverActions }) => apiDiscoverActions,
        )
  ).catch((cause: unknown) => {
    actions = null;
    throw cause;
  }));
export const discoverActionService: DiscoverActionService = {
  source: appConfig.dataSource,
  async activity(options) {
    return (await action()).activity(options);
  },
  async save(reference, saved, options) {
    return (await action()).save(reference, saved, options);
  },
};
