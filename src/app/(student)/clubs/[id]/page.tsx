import { pageMetadata } from "@/config/metadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { engagementService } from "@/services";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = engagementService.getClubById(id);
  return pageMetadata(
    item ? item.name : "Club",
    item ? item.description : "Explore your GCTU campus with CampusOne.",
  );
}

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const club = engagementService.getClubById(id);
  if (!club) notFound();

  return (
    <div className="space-y-4">
      <Link href="/clubs" className="inline-flex min-h-11 items-center text-sm text-brand">
        ← Back to clubs
      </Link>
      <Card>
        <p className="text-xs uppercase text-muted-foreground">{club.category}</p>
        <h1 className="mt-1 text-2xl font-bold">{club.name}</h1>
        <p className="mt-3 text-foreground">{club.description}</p>
        <h2 className="mt-4 font-semibold">Objectives</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-foreground">
          {club.objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
        <Badge className="mt-4" tone="warning">
          Membership workflow is demo-driven on Clubs main page.
        </Badge>
      </Card>
    </div>
  );
}
