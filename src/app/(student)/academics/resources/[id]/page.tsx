import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { academicsService } from "@/services/demo";

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = academicsService.getResourceById(id);
  if (!resource) notFound();

  return (
    <div className="space-y-4">
      <Link href="/academics" className="text-sm text-blue-700">← Back to resources</Link>
      <Card>
        <p className="text-xs uppercase text-slate-500">{resource.course}</p>
        <h1 className="mt-1 text-2xl font-bold">{resource.title}</h1>
        <p className="mt-3 text-slate-700">{resource.description}</p>
        <p className="mt-2 text-sm text-slate-500">Type: {resource.category} • Uploaded {resource.uploadedAt}</p>
        {resource.downloadable && resource.url ? (
          <a href={resource.url} target="_blank" rel="noreferrer">
            <Button className="mt-4">Download resource</Button>
          </a>
        ) : (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">No file download available for this resource.</p>
        )}
      </Card>
    </div>
  );
}
