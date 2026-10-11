import { appConfig } from "@/config/app-config";
import { homeFeedService } from "@/services";
import { selectFeatured, upcomingEvents, openOpportunities } from "@/lib/home/featured";
import { HomeClockProvider } from "./hooks/use-home-clock";
import { FeaturedContentCarousel } from "./components/featured-content-carousel";
import { FeaturedContentSlide } from "./components/featured-content-slide";
import { ClubsHero } from "./components/clubs-hero";
import { QuickActions } from "./components/quick-actions";
import { RecommendedContent } from "./components/recommended-content";
import { TodayOverview } from "./components/today-overview";
import { WelcomeHeader } from "./components/welcome-header";
import { InstitutionalLinks } from "./components/institutional-links";
import { HomeDataFeedback } from "./components/home-data-feedback";
import type { HomeFeedService } from "@/types/home";
import type { ServiceOptions } from "@/types/service-contracts";
export async function HomeFeature({
  options,
  service = homeFeedService,
}: {
  options?: ServiceOptions;
  service?: HomeFeedService;
}) {
  const feed = await service.snapshot(options),
    now = new Date(feed.now);
  const featured = selectFeatured(feed.featured, feed.campaigns, now);
  return (
    <HomeClockProvider initialNow={feed.now}>
      <div className="min-w-0 space-y-6 md:space-y-8">
        <WelcomeHeader />
        <HomeDataFeedback unavailable={feed.unavailable} truncated={feed.truncated} />
        {featured.length ? (
          <FeaturedContentCarousel
            activeUntil={featured.map((item) =>
              item.sponsored || item.type === "sponsored"
                ? feed.campaigns.find((campaign) => campaign.id === item.campaignId)?.endDate
                : undefined,
            )}
          >
            {featured.map((item, index) => (
              <FeaturedContentSlide key={item.id} item={item} priority={index === 0} />
            ))}
          </FeaturedContentCarousel>
        ) : null}
        <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-[1.65fr_1fr]">
          <ClubsHero count={feed.clubs.length} priority={!featured.length} />
          <TodayOverview
            sessions={feed.timetable}
            courses={feed.courses}
            timetableUnavailable={feed.unavailable.includes("timetable")}
          />
        </div>
        <QuickActions />
        <InstitutionalLinks />
        <RecommendedContent
          events={upcomingEvents(feed.events, now)}
          opportunities={openOpportunities(feed.opportunities, now)}
          now={now}
        />
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-[10px] text-muted-foreground">
          <span>
            {appConfig.dataSource === "demo"
              ? "Made for student life. Still a demo, never an official GCTU service."
              : "API preview · device-only demo planner. Not an official GCTU service."}
          </span>
          <span>Generated/CC0 imagery · your next chapter starts here.</span>
        </footer>
      </div>
    </HomeClockProvider>
  );
}
