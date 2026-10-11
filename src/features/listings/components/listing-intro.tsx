import { MagazineHeader } from "@/components/shared/magazine-header";
import { appConfig } from "@/config/app-config";
import { listingConfig } from "@/config/listings";
import type { ListingDomain } from "@/types/listings";
export function ListingIntro({ domain }: { domain: ListingDomain }) {
  const config = listingConfig[domain];
  return (
    <>
      <MagazineHeader
        title={config.title}
        description={config.subtitle}
        eyebrow={config.label}
        image={config.image}
      />
      <p className="rounded-control bg-surface-muted p-4 text-xs text-muted-foreground">
        {appConfig.dataSource === "demo"
          ? "Fictional demo listings, prices and people. Covers are generated illustrations, not verified property/product photographs. Local actions do not contact a real person."
          : "Publisher data. Verify offers and contact details independently."}{" "}
        Never send deposits, passwords or identity documents through an
        unverified listing.
      </p>
    </>
  );
}
