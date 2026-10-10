"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Card } from "@/components/ui";
import { lifeService } from "@/services/demo";

export function MarketplaceFeature() {
  const listings = lifeService.listMarketplace();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader title="Marketplace" description="Student-oriented listings and digital products (demo enquiries only)." />
      <div className="grid gap-3 md:grid-cols-2">
        {listings.map((listing) => (
          <Card key={listing.id}>
            <p className="text-xs uppercase text-slate-500">{listing.category}</p>
            <h2 className="mt-1 font-semibold">{listing.title}</h2>
            <p className="text-sm text-slate-600">{listing.priceLabel}</p>
            <p className="mt-2 text-sm text-slate-700">{listing.description}</p>
            <div className="mt-3 flex gap-2">
              <Link href={`/marketplace/${listing.id}`}><Button size="sm" variant="secondary">View</Button></Link>
              <Button size="sm" onClick={() => setSelected(listing.id)}>Enquire (demo)</Button>
            </div>
            {selected === listing.id ? <p className="mt-2 text-xs text-emerald-700">Demo enquiry created. Backend messaging integration pending.</p> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
