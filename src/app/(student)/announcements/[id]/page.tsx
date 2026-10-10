import { pageMetadata } from "@/config/metadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { engagementService } from "@/services";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = engagementService.listAnnouncements().find((item) => item.id === id);
  return pageMetadata(
    item ? item.title : "Announcement",
    item ? item.content : "Explore your GCTU campus with CampusOne.",
  );
}

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const announcement = engagementService.listAnnouncements().find((item) => item.id === id);
  if (!announcement) notFound();

  return (
    <div className="space-y-4">
      <Link href="/announcements" className="inline-flex min-h-11 items-center text-sm text-brand">
        ← Back to announcements
      </Link>
      <Card>
        <h1 className="text-2xl font-bold">{announcement.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Published {announcement.publishedAt} • {announcement.category}
        </p>
        <p className="mt-4 text-foreground">{announcement.content}</p>
      </Card>
    </div>
  );
}
