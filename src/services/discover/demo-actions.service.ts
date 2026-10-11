import { discoverBookmarkTypes, discoverCategories } from "@/config/discover";
import { discoverReferenceSchema } from "../validation/discover.schema";
import type { DiscoverActionService } from "@/types/discover";
import type { ServiceOptions } from "@/types/service-contracts";
async function context(options: ServiceOptions = {}) {
  options.signal?.throwIfAborted();
  const [{ useAppStore: app }, { useAuthStore: auth }] = await Promise.all([
    import("@/stores/app-store"),
    import("@/stores/auth-store"),
  ]);
  const original = auth.getState();
  if (!original.user || original.source !== "demo")
    throw new Error(
      "Sign in to a local demo profile before saving a campus item.",
    );
  const owner = () => {
    options.signal?.throwIfAborted();
    const live = auth.getState();
    if (
      live.source !== original.source ||
      live.user?.id !== original.user?.id ||
      live.user?.email !== original.user?.email ||
      live.role !== original.role
    )
      throw new Error(
        "Your profile changed. This save was not applied; try again.",
      );
  };
  owner();
  return { app, owner };
}
export const demoDiscoverActions: DiscoverActionService = {
  source: "demo",
  async activity(options) {
    const { app, owner } = await context(options);
    owner();
    const saved = discoverCategories.flatMap((category) =>
      app
        .getState()
        .bookmarks.filter(
          (b) => b.entityType === discoverBookmarkTypes[category],
        )
        .map((b) => ({ category, id: b.entityId })),
    );
    return structuredClone({ saved });
  },
  async save(input, saved, options) {
    const reference = discoverReferenceSchema.parse(input),
      { app, owner } = await context(options);
    const { discoverCatalogService } = await import("@/services");
    if (!(await discoverCatalogService.get(reference, options)))
      throw new Error("This campus item is no longer available.");
    owner();
    const type = discoverBookmarkTypes[reference.category],
      matches = (b: { entityType: string; entityId: string }) =>
        b.entityType === type && b.entityId === reference.id,
      correct = () => app.getState().bookmarks.some(matches) === saved;
    if (correct()) {
      let persisted = false;
      try {
        const persistence = app.persist.getOptions();
        const record = persistence.name
          ? await persistence.storage?.getItem(persistence.name)
          : undefined;
        persisted = !!record && record.state.bookmarks.some(matches) === saved;
      } catch {
        /* Memory is not proof of durable persistence. */
      }
      owner();
      return { persisted };
    }
    try {
      app
        .getState()
        .setBookmark(
          { id: crypto.randomUUID(), entityId: reference.id, entityType: type },
          saved,
        );
      if (!correct())
        throw new Error("This campus save was not applied. Please retry.");
      return { persisted: true };
    } catch (cause) {
      if (!correct()) throw cause;
      return { persisted: false };
    }
  },
};
