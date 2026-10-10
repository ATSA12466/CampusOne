import { pageMetadata } from "@/config/metadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { engagementService } from "@/services";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = engagementService.listOpportunities().find((item) => item.id === id);
  return pageMetadata(
    item ? item.title : "Opportunity",
    item ? item.summary : "Explore your GCTU campus with CampusOne.",
  );
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = engagementService.listOpportunities().find((item) => item.id === id);
  if (!opportunity) notFound();

  return (
    <div className="space-y-4">
      <Link href="/opportunities" className="inline-flex min-h-11 items-center text-sm text-brand">
        ← Back to opportunities
      </Link>
      <Card>
        <h1 className="text-2xl font-bold">{opportunity.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {opportunity.provider} • {opportunity.category}
        </p>
        <p className="mt-3 text-foreground">{opportunity.summary}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Deadline: {opportunity.deadline} (demo data)
        </p>
      </Card>
    </div>
  );
}
