"use client";
import Link from "next/link";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { Gallery } from "@/components/media/gallery";
import { Card } from "@/components/ui/card";
import { listingConfig } from "@/config/listings";
import { useDiscoverActivity } from "@/features/discover/hooks/use-discover-activity";
import { useDiscoverSave } from "@/features/discover/hooks/use-discover-save";
import { discoverKey } from "@/lib/discover/directory";
import { useAuthStore } from "@/stores/auth-store";
import type { ListingDomain, ListingDetails } from "@/types/listings";
import type { DiscoverItem } from "@/types/discover";
import { ListingSidebar } from "./components/listing-sidebar";
export function ListingDetail({
  domain,
  item,
  details,
}: {
  domain: ListingDomain;
  item: DiscoverItem;
  details?: ListingDetails;
}) {
  const activity = useDiscoverActivity(),
    action = useDiscoverSave(activity.refresh),
    user = useAuthStore((s) => s.user),
    saved = activity.saved.some((i) => discoverKey(i) === discoverKey(item));
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href={domain === "resources" ? "/academics" : `/${domain}`}
        className="inline-flex min-h-11 items-center text-sm text-brand"
      >
        ← Back to {listingConfig[domain].label}
      </Link>
      <MagazineHeader
        title={item.title}
        description={details?.intro ?? item.description}
        image={item.cover}
        eyebrow={listingConfig[domain].label}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <h2 className="font-display text-2xl font-semibold">
              A closer look.
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              {(
                details?.body ?? [
                  item.description,
                  "More listing details have not been supplied.",
                ]
              ).map((p, n) => (
                <p key={n}>{p}</p>
              ))}
            </div>
            <ul className="mt-5 flex flex-wrap gap-2">
              {details?.tags.map((t) => (
                <li
                  key={t}
                  className="rounded-full bg-surface-muted px-3 py-2 text-xs"
                >
                  {t}
                </li>
              ))}
            </ul>
          </Card>
          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold">
              The picture.
            </h2>
            <Gallery
              images={details?.gallery?.length ? details.gallery : [item.cover]}
              label={`${item.title} illustrative gallery`}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Illustrative imagery. Do not rely on these generated scenes to
              inspect a property or product.
            </p>
          </section>
          {details?.eligibility?.length ? (
            <Card>
              <h2 className="font-display text-xl font-semibold">
                Before you apply.
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                {details.eligibility.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
        <ListingSidebar
          domain={domain}
          item={item}
          details={details}
          user={!!user}
          saved={saved}
          loading={activity.loading}
          activityError={activity.error}
          busy={!!action.busy}
          error={action.error}
          onSave={() => void action.save(item, !saved)}
        />
      </div>
    </div>
  );
}
