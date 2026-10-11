import { cache } from "react";
import { pageMetadata } from "@/config/metadata";
import { notFound } from "next/navigation";
import { clubCatalogService } from "@/services";
import { ClubDetailFeature } from "@/features/clubs/detail";
import { clubServerOptions } from "@/features/clubs/server-options";
const getClub = cache(async (id: string) => clubCatalogService.get(id, await clubServerOptions()));
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params,
    club = await getClub(id);
  return pageMetadata(
    club?.name ?? "Club",
    club?.description ?? "Find your community with CampusOne.",
  );
}
export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params,
    club = await getClub(id);
  if (!club) notFound();
  return <ClubDetailFeature club={club} />;
}
