import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { engagementService } from "@/services/demo";

export default async function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const announcement = engagementService.listAnnouncements().find((item) => item.id === id);
  if (!announcement) notFound();

  return (
    <div className="space-y-4">
      <Link href="/announcements" className="text-sm text-blue-700">← Back to announcements</Link>
      <Card>
        <h1 className="text-2xl font-bold">{announcement.title}</h1>
        <p className="mt-2 text-sm text-slate-500">Published {announcement.publishedAt} • {announcement.category}</p>
        <p className="mt-4 text-slate-700">{announcement.content}</p>
      </Card>
    </div>
  );
}
