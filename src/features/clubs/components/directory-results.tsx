import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/ui";
import { LoadMoreClubs } from "./load-more-clubs";
import { DirectoryEmpty } from "./directory-empty";
import { ErrorState } from "@/components/shared/error-state";
import { clubActionService } from "@/services";
import type { Club, UserProfile } from "@/types";
import type { useClubDirectory } from "../hooks/use-club-directory";
import type { useClubActivity } from "../hooks/use-club-activity";
import type { ClubMutations } from "../hooks/use-club-mutations";
import { ClubCard } from "./club-card";
import { DirectoryFilters } from "./directory-filters";
interface Props {
  state: ReturnType<typeof useClubDirectory>;
  activity: ReturnType<typeof useClubActivity>;
  action: ClubMutations;
  user: UserProfile | null;
  onRequest: (club: Club) => void;
}
export function DirectoryResults({ state, activity, action, user, onRequest }: Props) {
  const [retrying, startRetry] = useTransition();
  const router = useRouter(),
    { catalog, filter, categories, change, results, resultsRef, reset } = state;
  return (
    <section
      id="club-directory"
      aria-labelledby="directory-title"
      className="scroll-mt-24 space-y-5"
    >
      <DirectoryFilters filter={filter} categories={categories} onChange={change} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <h2
          id="directory-title"
          ref={resultsRef}
          tabIndex={-1}
          className="font-display text-xl font-semibold"
        >
          {filter.view === "saved"
            ? "Your saved clubs"
            : filter.view === "mine"
              ? "Your communities"
              : "Explore the communities"}
        </h2>
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
          {catalog.error
            ? "Directory unavailable"
            : `${results.total} ${results.total === 1 ? "community" : "communities"}${results.total ? ` · page ${results.page} of ${results.totalPages}` : ""}`}
        </p>
      </div>
      {catalog.error ? (
        <ErrorState
          title="The communities need another moment."
          description={catalog.error}
          onRetry={() => {
            if (!retrying) startRetry(() => router.refresh());
          }}
        />
      ) : !results.total ? (
        <DirectoryEmpty view={filter.view} onReset={reset} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.items.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              membership={activity.memberships.find(
                (item) => item.clubId === club.id && item.userId === user?.id,
              )}
              saved={activity.savedIds.includes(club.id)}
              canSave={!!user && !activity.loading && !activity.error}
              busy={!!action.busy}
              canRequest={
                !!user &&
                !activity.loading &&
                !activity.error &&
                !activity.memberships.some(
                  (item) =>
                    item.clubId === club.id &&
                    item.userId === user.id &&
                    item.status !== "rejected",
                )
              }
              onRequestJoin={() => onRequest(club)}
              onSave={() =>
                void action.run(
                  `save:${club.id}`,
                  (signal) =>
                    clubActionService.save(club.id, !activity.savedIds.includes(club.id), {
                      signal,
                    }),
                  activity.savedIds.includes(club.id) ? "Club removed from saved" : "Club saved",
                )
              }
            />
          ))}
        </div>
      )}
      {retrying ? (
        <p role="status" className="text-xs text-muted-foreground">
          Retrying the community directory…
        </p>
      ) : null}
      {user && activity.loading ? (
        <p role="status" className="text-xs text-muted-foreground">
          Loading your saved clubs and memberships…
        </p>
      ) : null}
      {activity.error ? (
        <ErrorState
          title="Your club activity could not load."
          description={activity.error}
          onRetry={activity.refresh}
        />
      ) : null}
      {!user ? (
        <p className="text-sm text-muted-foreground">
          <Link
            prefetch={false}
            href="/sign-in?next=%2Fclubs"
            className="inline-flex min-h-11 items-center font-semibold text-brand"
          >
            Sign in to a profile
          </Link>{" "}
          to request membership and keep a saved-club list. You can still explore every community.
        </p>
      ) : null}
      {action.error ? (
        <p className="text-sm text-danger" role="alert">
          {action.error}
        </p>
      ) : null}
      {results.totalPages > 1 ? (
        <Pagination
          label="Club directory pages"
          page={results.page}
          totalPages={results.totalPages}
          onPageChange={(page) => {
            change({ page });
            resultsRef.current?.focus();
          }}
        />
      ) : null}
      <LoadMoreClubs state={state} />
    </section>
  );
}
