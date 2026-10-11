import { createHash } from "node:crypto";
import { routeMetadata } from "@/config/metadata";
import { ClubsFeature } from "@/features/clubs";
import { clubServerOptions } from "@/features/clubs/server-options";
import { clubCatalogService } from "@/services";
export const metadata = routeMetadata("clubs");
export default async function ClubsPage() {
  const initial = await clubCatalogService.list(1, await clubServerOptions());
  return (
    <ClubsFeature
      initial={initial}
      key={createHash("sha256").update(JSON.stringify(initial)).digest("hex")}
    />
  );
}
