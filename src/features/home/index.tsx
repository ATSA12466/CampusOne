"use client";

import { homeService, engagementService } from "@/services";
import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";
import { FeaturedContentCarousel } from "./components/featured-content-carousel";
import { QuickActions } from "./components/quick-actions";
import { RecommendedContent } from "./components/recommended-content";
import { TodayOverview } from "./components/today-overview";
import { WelcomeHeader } from "./components/welcome-header";

export function HomeFeature() {
  const user = useAuthStore((state) => state.user);
  const tasks = useAppStore((state) => state.tasks);

  const featured = homeService.listFeaturedContent();
  const events = engagementService.listEvents();
  const opportunities = engagementService.listOpportunities();

  return (
    <div className="space-y-6">
      <WelcomeHeader name={user?.name} />
      <FeaturedContentCarousel items={featured} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TodayOverview tasks={tasks} events={events} />
        </div>
        <QuickActions />
      </div>
      <RecommendedContent opportunities={opportunities} />
    </div>
  );
}
