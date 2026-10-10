import { pageMetadata } from "@/config/metadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { academicsService } from "@/services";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = academicsService.getResourceById(id);
  return pageMetadata(
    item ? item.title : "Resource",
    item ? item.description : "Explore your GCTU campus with CampusOne.",
  );
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = academicsService.getResourceById(id);
  if (!resource) notFound();

  return (
    <div className="space-y-4">
      <Link href="/academics" className="inline-flex min-h-11 items-center text-sm text-brand">
        ← Back to resources
      </Link>
      <Card>
        <p className="text-xs uppercase text-muted-foreground">{resource.course}</p>
        <h1 className="mt-1 text-2xl font-bold">{resource.title}</h1>
        <p className="mt-3 text-foreground">{resource.description}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Type: {resource.category} • Uploaded {resource.uploadedAt}
        </p>
        {resource.downloadable && resource.url ? (
          <Button asChild className="mt-4">
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              Download resource
            </a>
          </Button>
        ) : (
          <p className="mt-4 rounded-xl bg-warning-soft p-3 text-sm text-warning">
            No file download available for this resource.
          </p>
        )}
      </Card>
    </div>
  );
}
