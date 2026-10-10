"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Card } from "@/components/ui";
import { lifeService } from "@/services";

export function AccommodationFeature() {
  const listings = lifeService.listAccommodation();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Accommodation"
        description="Discover hostels and student accommodation options (demo listings)."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {listings.map((listing) => (
          <Card key={listing.id}>
            <h2 className="font-semibold">{listing.title}</h2>
            <p className="text-sm text-muted-foreground">{listing.location}</p>
            <p className="text-sm text-foreground">{listing.price}</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              {listing.facilities.map((facility) => (
                <li key={facility}>{facility}</li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <Link href={`/accommodation/${listing.id}`}>
                <Button size="sm" variant="secondary">
                  Details
                </Button>
              </Link>
              <Button size="sm" onClick={() => setSelected(listing.id)}>
                Enquire (demo)
              </Button>
            </div>
            {selected === listing.id ? (
              <p className="mt-2 text-xs text-success">Demo enquiry saved for follow-up.</p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
