import type { ServiceOptions } from "@/types/service-contracts";
import type { ClubActionService } from "@/types";
import { membershipNoteSchema } from "@/services/validation/club.schema";
async function stores(options?: ServiceOptions) {
  options?.signal?.throwIfAborted();
  const [{ useAppStore }, { useAuthStore }] = await Promise.all([
    import("@/stores/app-store"),
    import("@/stores/auth-store"),
  ]);
  options?.signal?.throwIfAborted();
  const user = useAuthStore.getState().user;
  if (!user || useAuthStore.getState().source !== "demo")
    throw new Error("Sign in to a local demo profile before changing a club.");
  const owner = () => {
    options?.signal?.throwIfAborted();
    const current = useAuthStore.getState();
    if (
      current.source !== "demo" ||
      current.user?.id !== user.id ||
      current.user.email !== user.email
    )
      throw new Error("Your profile changed. This action was not applied; try again.");
    return current.user;
  };
  return { app: useAppStore.getState(), state: useAppStore.getState, user, owner };
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
export const demoClubActions: ClubActionService = {
  source: "demo",
  async activity(options) {
    const { app, owner } = await stores(options);
    owner();
    return structuredClone({
      memberships: app.memberships,
      savedIds: app.bookmarks
        .filter((item) => item.entityType === "club")
        .map((item) => item.entityId),
    });
  },
  async request(clubId, input, options) {
    const note = membershipNoteSchema.parse(input),
      context = await stores(options);
    const { clubCatalogService } = await import("./catalog.service");
    const club = await clubCatalogService.get(clubId, options);
    const user = context.owner();
    if (!club) throw new Error("This club is no longer available.");
    if (club.details?.accepting === false)
      throw new Error("This club is not accepting requests right now.");
    return mutate(
      () =>
        context.app.requestMembership(clubId, user.id, {
          note,
          applicantName: user.name,
          requestedAt: new Date().toISOString().slice(0, 10),
        }),
      () =>
        context
          .state()
          .memberships.some(
            (item) =>
              item.clubId === clubId && item.userId === user.id && item.status === "pending",
          ),
    );
  },
  async withdraw(clubId, options) {
    const { app, owner, state } = await stores(options);
    const user = owner();
    return mutate(
      () => app.withdrawMembership(clubId, user.id),
      () => !state().memberships.some((item) => item.clubId === clubId && item.userId === user.id),
    );
  },
  async review(id, status, options) {
    const { app, owner, state } = await stores(options),
      user = owner();
    if (!["club-executive", "administrator"].includes(user.role))
      throw new Error("Only the demo executive role can review a request.");
    const existing = state().memberships.find((item) => item.id === id);
    if (!existing || existing.status !== "pending")
      throw new Error("This request has already changed. Refresh your reviews.");
    return mutate(
      () => app.reviewMembership(id, status),
      () => state().memberships.find((item) => item.id === id)?.status === status,
    );
  },
  async save(clubId, saved, options) {
    const { app, owner, state } = await stores(options);
    owner();
    const exists = state().bookmarks.some(
      (item) => item.entityType === "club" && item.entityId === clubId,
    );
    return exists === saved
      ? { persisted: true }
      : mutate(
          () =>
            app.toggleBookmark({ id: crypto.randomUUID(), entityId: clubId, entityType: "club" }),
          () =>
            state().bookmarks.some(
              (item) => item.entityType === "club" && item.entityId === clubId,
            ) === saved,
        );
  },
};
