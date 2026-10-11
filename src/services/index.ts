import { appConfig } from "@/config/app-config";
import { authService } from "./auth/auth.service";
import type { SearchPreviewMode, SearchService } from "@/types/search";
import type { CatalogService } from "@/types/service-contracts";

// Legacy screens must not download API schemas or catalog code they don't use.
let selected: Promise<CatalogService> | null = null;
function catalog() {
  selected ??= (
    appConfig.dataSource === "api"
      ? import("./api/catalog.service").then(({ createApiCatalog }) =>
          createApiCatalog(),
        )
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
export { demoAppStateService } from "./demo/app-state.service";
export { demoAuthService } from "./auth/demo-auth.service";

// Search/UI code and response schemas are fetched only after opening search.
let search: Promise<SearchService> | null = null;
export const searchService: SearchService = {
  async search(query) {
    search ??= import("./search/search.service")
      .then(({ createSearchService }) => createSearchService(campusService))
      .catch((error: unknown) => {
        search = null;
        throw error;
      });
    return (await search).search(query);
  },
};

// Development showcase entry point; not used by the production student shell.
export function searchPreviewService(mode: SearchPreviewMode): SearchService {
  let preview: Promise<SearchService> | null = null;
  return {
    async search(query) {
      preview ??= import("./demo/search-preview.service").then(
        ({ createSearchPreviewService }) =>
          createSearchPreviewService(searchService, mode),
      );
      return (await preview).search(query);
    },
  };
}

// Initial Home reads use this async boundary in a Server Component.
export const homeFeedService: import("@/types/home").HomeFeedService = {
  async snapshot(options) {
    const { createHomeFeedService } = await import("./home/home.service");
    return createHomeFeedService(campusService).snapshot(options);
  },
};

export { authService };
export { onboardingService } from "./profile/onboarding.service";
export { localPhotoService } from "./profile/local-photo.service";
export function authPreviewService(
  mode: import("@/types/auth").AuthPreview,
): import("@/types/auth").AuthService {
  let preview: Promise<import("@/types/auth").AuthService> | undefined;
  const get = () =>
    (preview ??= import("./demo/auth-preview.service").then(
      ({ createAuthPreview }) => createAuthPreview(authService, mode),
    ));
  return {
    source: appConfig.dataSource,
    async signIn(input, options) {
      return (await get()).signIn(input, options);
    },
    async register(input, options) {
      return (await get()).register(input, options);
    },
    async requestReset(email, options) {
      return (await get()).requestReset(email, options);
    },
    async session(options) {
      return (await get()).session(options);
    },
    async signOut(options) {
      return (await get()).signOut(options);
    },
  };
}

// Clubs Phase 6: typed bounded catalog + intent-loaded source-specific actions.
export { clubCatalogService } from "./clubs/catalog.service";
export { clubActionService } from "./clubs/actions.service";

// Events Phase 6B: bounded catalog and intent-loaded source-aware RSVP/tickets.
export { eventCatalogService } from "./events/catalog.service";
export { eventActionService } from "./events/actions.service";

// Discover Phase 6C: bounded cross-campus reads and source-aware shared saves.
export {
  discoverCatalogService,
  discoverActionService,
} from "./discover/discover.service";

export { workspaceService } from "./workspace/workspace.service";

export { photoRecordService } from "./profile/photo-record.service";

export { profileService } from "./profile/profile.service";

export { notificationService } from "./notifications/notification.service";

export { taskService } from "./tasks/task.service";
export { studyPlannerService } from "./study/study-planner.service";
