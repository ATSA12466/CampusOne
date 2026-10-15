import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { engagementService } from "@/services/api";

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const club = await engagementService.getClubById(id);
  if (!club) notFound();

  return (
    <div className="space-y-4">
      <Link href="/clubs" className="text-sm text-blue-700">← Back to clubs</Link>
      <Card>
        <p className="text-xs uppercase text-slate-500">{club.category}</p>
        <h1 className="mt-1 text-2xl font-bold">{club.name}</h1>
        <p className="mt-3 text-slate-700">{club.description}</p>
        <h2 className="mt-4 font-semibold">Objectives</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
          {club.objectives.map((objective: string) => <li key={objective}>{objective}</li>)}
        </ul>
        <Badge className="mt-4" tone="warning">Membership workflow is demo-driven on Clubs main page.</Badge>
      </Card>
    </div>
  );
}
