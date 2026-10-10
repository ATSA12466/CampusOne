import Link from "next/link";
import { Badge, Button } from "@/components/ui";
import type { FeaturedContentItem } from "@/types";

export function FeaturedContentSlide({ item }: { item: FeaturedContentItem }) {
  return (
    <article className="relative min-h-[270px] overflow-hidden rounded-3xl border border-white/20 p-6 text-white md:min-h-[320px] md:p-8">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${item.thumbnail})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(2,23,48,0.9),rgba(2,23,48,0.65),rgba(59,130,246,0.5))]" />
      <div className="relative z-10 max-w-xl space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge tone="primary" className="bg-white/20 text-white">
            {item.type}
          </Badge>
          {item.sponsored ? (
            <Badge tone="gold" className="bg-amber-200 text-amber-900">
              Sponsored (demo)
            </Badge>
          ) : null}
          {item.duration ? <Badge className="bg-white/20 text-white">{item.duration}</Badge> : null}
        </div>
        <h2 className="text-2xl font-bold leading-tight text-balance md:text-3xl">{item.title}</h2>
        <p className="text-sm text-white/85 md:text-base">{item.description}</p>
        <Link href={item.destination}>
          <Button variant="secondary" className="mt-2 border-white/30 bg-white/10 text-white hover:bg-white/20">
            {item.ctaLabel ?? "Open"}
          </Button>
        </Link>
      </div>
    </article>
  );
}
