import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { engagementService } from "@/services/demo";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunity = engagementService.listOpportunities().find((item) => item.id === id);
  if (!opportunity) notFound();

  return (
    <div className="space-y-4">
      <Link href="/opportunities" className="text-sm text-blue-700">← Back to opportunities</Link>
      <Card>
        <h1 className="text-2xl font-bold">{opportunity.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{opportunity.provider} • {opportunity.category}</p>
        <p className="mt-3 text-slate-700">{opportunity.summary}</p>
        <p className="mt-2 text-xs text-slate-500">Deadline: {opportunity.deadline} (demo data)</p>
      </Card>
    </div>
  );
}
