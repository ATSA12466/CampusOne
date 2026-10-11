import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/config/metadata";
import { campusService } from "@/services";
import { discoverServerOptions } from "@/features/discover/server-options";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { Card } from "@/components/ui";
import { images } from "@/config/images";
import { appConfig } from "@/config/app-config";
const get = cache(async (id: string) => {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return null;
  return campusService.get("announcements", id, {
    ...(await discoverServerOptions()),
    signal: AbortSignal.timeout(8000),
  });
});
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    item = await get(id);
  return pageMetadata(
    item?.title ?? "Announcement",
    item?.content ?? "Campus updates.",
  );
}
export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    item = await get(id);
  if (!item || item.id !== id) notFound();
  return (
    <article className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/announcements"
        className="inline-flex min-h-11 items-center text-sm text-brand"
      >
        ← Back to announcements
      </Link>
      <MagazineHeader
        eyebrow={`${item.category} · ${item.publishedAt}`}
        title={item.title}
        description="Take a moment to get the whole update."
        image={images.clubDebate}
      />
      <Card>
        <h2 className="font-display text-xl font-semibold">The update</h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
          {item.content}
        </p>
        {appConfig.dataSource === "demo" ? (
          <p className="mt-6 text-xs text-muted-foreground">
            Fictional demo announcement, not an official GCTU notice. Check
            university channels before making plans.
          </p>
        ) : null}
      </Card>
    </article>
  );
}
