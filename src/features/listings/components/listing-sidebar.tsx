import { discoverStatus } from "@/lib/discover/status";
import { useCampusClock } from "@/components/providers/campus-clock";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listingConfig } from "@/config/listings";
import { EnquiryDialog } from "./enquiry-dialog";
import type { ListingDomain, ListingDetails } from "@/types/listings";
import type { DiscoverItem } from "@/types/discover";
export function ListingSidebar({
  domain,
  item,
  details,
  user,
  saved,
  loading,
  activityError,
  busy,
  error,
  onSave,
}: {
  domain: ListingDomain;
  item: DiscoverItem;
  details?: ListingDetails;
  user: boolean;
  saved: boolean;
  loading: boolean;
  activityError: string;
  busy: boolean;
  error: string;
  onSave: () => void;
}) {
  const now = useCampusClock();
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <Card>
        <h2 className="font-display text-xl font-semibold">Good to know.</h2>
        {domain === "opportunities" && now ? (
          <p
            role="status"
            className="mt-3 rounded-control bg-surface-muted p-3 text-sm"
          >
            {discoverStatus(item, now)}
          </p>
        ) : null}
        <dl className="mt-4 space-y-3 text-sm">
          {item.facts.map((f) => (
            <div key={f.label}>
              <dt className="text-xs text-muted-foreground">{f.label}</dt>
              <dd className="font-medium">{f.value}</dd>
            </div>
          ))}
          {details ? (
            <>
              {!item.facts.some((f) => f.label === "Type") ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Type</dt>
                  <dd>{details.kind}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs text-muted-foreground">
                  Publisher / contact
                </dt>
                <dd>{details.owner}</dd>
              </div>
              {details.walkMinutes !== undefined ? (
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Illustrative walk time
                  </dt>
                  <dd>{details.walkMinutes} minutes · not route guidance</dd>
                </div>
              ) : null}
            </>
          ) : null}
        </dl>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="secondary"
            aria-pressed={saved}
            disabled={!user || loading || !!activityError || !!busy}
            onClick={() => void onSave()}
          >
            {busy ? "Saving…" : saved ? "Remove from saved" : "Save for later"}
          </Button>
          <EnquiryDialog
            domain={domain}
            id={item.id}
            title={listingConfig[domain].action}
            intent={domain === "opportunities" ? "application" : "enquiry"}
          />
          <EnquiryDialog
            domain={domain}
            id={item.id}
            title="Report a concern"
            intent="report"
          />
          {domain === "accommodation" ? (
            <a
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-control border border-border px-3 text-sm text-brand"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((item.facts.find((f) => f.label === "Location")?.value ?? "GCTU") + ", Accra, Ghana")}`}
            >
              Search this area on Maps ↗
            </a>
          ) : null}
          {details?.applicationUrl ? (
            <a
              href={details.applicationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center text-sm text-brand"
            >
              Open publisher application page ↗
            </a>
          ) : null}
        </div>
        {!user ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Sign in to save or prepare a private draft.
          </p>
        ) : null}
        {error || activityError ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error || activityError}
          </p>
        ) : null}
      </Card>
      <p className="rounded-control bg-warning-soft p-4 text-xs leading-relaxed text-warning">
        Fictional demo offer. Verify identity, dates, fees and terms
        independently. No payment, application, viewing or enrolment is arranged
        by this page.
      </p>
    </aside>
  );
}
