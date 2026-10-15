"use client";

import { useEffect, useState } from "react";
import { homeService, engagementService } from "@/services/api";
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

  const [featured, setFeatured] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [f, ev, op] = await Promise.all([
          homeService.listFeaturedContent(),
          engagementService.listEvents(),
          engagementService.listOpportunities(),
        ]);
        if (!mounted) return;
        setFeatured(f ?? []);
        setEvents(ev ?? []);
        setOpportunities(op ?? []);
      } catch (e) {
        // swallow for now; frontend will still render demo fallbacks if needed
        console.error("Error loading backend data", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Render with available data. Keep same composition as before.
  return (
    <div className="space-y-6">
      <WelcomeHeader name={user?.name} />
      {loading ? (
        <FeaturedContentCarousel items={featured} />
      ) : (
        <FeaturedContentCarousel items={featured} />
      )}
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
