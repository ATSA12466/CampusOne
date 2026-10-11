import type { EventActionService } from "@/types/events";
import type { ServiceOptions } from "@/types/service-contracts";
import { bookingState, eventPhase } from "@/lib/events/schedule";
async function context(options?: ServiceOptions) {
  options?.signal?.throwIfAborted();
  const [{ useAppStore: app }, { useAuthStore: auth }] = await Promise.all([
    import("@/stores/app-store"),
    import("@/stores/auth-store"),
  ]);
  const original = auth.getState();
  if (!original.user || original.source !== "demo")
    throw new Error("Sign in to a local demo profile before changing an event.");
  const owner = () => {
    options?.signal?.throwIfAborted();
    const current = auth.getState();
    if (
      current.source !== "demo" ||
      current.user?.id !== original.user?.id ||
      current.user?.email !== original.user?.email ||
      current.role !== original.role
    )
      throw new Error("Your profile changed. This event action was not applied; try again.");
    return current.user;
  };
  owner();
  return { app, owner };
}
function mutate(action: () => void, verify: () => boolean) {
  try {
    action();
    return { persisted: true };
  } catch (error) {
    if (!verify()) throw error;
    return { persisted: false };
  }
}
async function unchanged(
  scope: Awaited<ReturnType<typeof context>>,
  kind: "rsvp" | "save",
  id: string,
  goal: boolean,
) {
  let persisted = false;
  try {
    const options = scope.app.persist.getOptions();
    const record = options.name ? await options.storage?.getItem(options.name) : undefined;
    const stored =
      kind === "rsvp"
        ? record?.state.registrations.includes(id)
        : record?.state.bookmarks.some(
            (item) => item.entityType === "event" && item.entityId === id,
          );
    persisted = !!record && stored === goal;
  } catch {
    /* Already correct in memory is not proof of device persistence. */
  }
  scope.owner();
  return { persisted };
}
export const demoEventActions: EventActionService = {
  source: "demo",
  async activity(options) {
    const { app, owner } = await context(options);
    owner();
    const state = app.getState();
    return structuredClone({
      goingIds: state.registrations,
      savedIds: state.bookmarks
        .filter((item) => item.entityType === "event")
        .map((item) => item.entityId),
      attendance: [],
    });
  },
  async rsvp(id, going, options) {
    const { app, owner } = await context(options);
    if (going) {
      const { eventCatalogService } = await import("./catalog.service");
      const event = await eventCatalogService.get(id, options);
      owner();
      if (!event) throw new Error("This event is no longer available.");
      if (
        !app.getState().registrations.includes(id) &&
        bookingState(event, new Date()) !== "available"
      )
        throw new Error(
          "This event is full, closed, cancelled or already over. Your RSVP was not added.",
        );
    } else owner();
    if (app.getState().registrations.includes(id) === going)
      return unchanged({ app, owner }, "rsvp", id, going);
    return mutate(
      () => app.getState().setEventRegistration(id, going),
      () => app.getState().registrations.includes(id) === going,
    );
  },
  async save(id, saved, options) {
    const { app, owner } = await context(options);
    const { eventCatalogService } = await import("./catalog.service");
    if (!(await eventCatalogService.get(id, options)))
      throw new Error("This event is no longer available.");
    owner();
    if (
      app
        .getState()
        .bookmarks.some((item) => item.entityType === "event" && item.entityId === id) === saved
    )
      return unchanged({ app, owner }, "save", id, saved);
    return mutate(
      () =>
        app
          .getState()
          .toggleBookmark({ id: crypto.randomUUID(), entityId: id, entityType: "event" }),
      () =>
        app
          .getState()
          .bookmarks.some((item) => item.entityType === "event" && item.entityId === id) === saved,
    );
  },
  async ticket(id, options) {
    const { app, owner } = await context(options);
    const { eventCatalogService } = await import("./catalog.service");
    const event = await eventCatalogService.get(id, options);
    owner();
    if (!event || !app.getState().registrations.includes(id))
      throw new Error("RSVP first to view this local demo ticket.");
    if (["ended", "cancelled", "unknown"].includes(eventPhase(event, new Date())))
      throw new Error("A ticket preview is not available for this event now.");
    return {
      eventId: id,
      reference: `DEMO-${id.toUpperCase()}`,
      payload: `CAMPUSONE_DEMO_NOT_VALID_FOR_ENTRY|${encodeURIComponent(id)}`,
      status: "valid",
      source: "demo",
    };
  },
};
