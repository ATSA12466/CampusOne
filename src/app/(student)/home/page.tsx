import { headers } from "next/headers";
import { homeFeedService } from "@/services";
import type { HomePreviewMode } from "@/types/home";
import { sessionHeaders } from "@/services/api/session-headers";
import { appConfig } from "@/config/app-config";
import { routeMetadata } from "@/config/metadata";
import { HomeFeature } from "@/features/home";
export const metadata = routeMetadata("home");
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Per-request clock/feed. Forward only allowlisted session cookies in API mode;
  // never send it through client component props or cache private feeds globally.
  const request = await headers();
  const options =
    appConfig.dataSource === "api"
      ? {
          headers: sessionHeaders(
            request.get("cookie"),
            (process.env.API_SESSION_COOKIE_NAMES ?? "").split(","),
          ),
        }
      : undefined;
  if (process.env.NODE_ENV === "development") {
    const query = await searchParams,
      mode = query["home-preview"];
    if (
      typeof mode === "string" &&
      ["empty", "inactive", "partial", "offline", "recover", "truncated"].includes(mode)
    ) {
      const { createHomePreviewService } = await import("@/services/demo/home-preview.service");
      const run = typeof query.run === "string" ? query.run.slice(0, 160) : "default";
      return (
        <>
          <p
            role="status"
            className="mb-5 rounded-control border border-border bg-warning-soft p-4 text-sm text-warning"
          >
            Development-only Home fixture: {mode}. Not live campus data.
          </p>
          <HomeFeature
            options={options}
            service={createHomePreviewService(homeFeedService, mode as HomePreviewMode, run)}
          />
        </>
      );
    }
  }
  return <HomeFeature options={options} />;
}
