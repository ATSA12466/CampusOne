"use client";

import { Button } from "@/components/ui/button";
import { MediaCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { useToast } from "@/components/ui/toast";
import { ShowcaseSection } from "./showcase-section";

export function StatesShowcase() {
  const toast = useToast();
  return (
    <ShowcaseSection
      id="states"
      number="07"
      title="Thoughtful, even in the in-between."
      description="A loading state shaped like its content. An empty state with somewhere to go. A friendly retry, not a technical error dumped on a student."
    >
      <div className="grid items-start gap-5 md:grid-cols-3">
        <div>
          <MediaCardSkeleton />
          <div className="mt-4 flex items-center gap-3">
            <Skeleton shape="circle" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-3/4" />
              <Skeleton className="w-1/2" />
            </div>
          </div>
        </div>
        <EmptyState
          title="Your next discovery starts here."
          description="No saved communities yet. Find a club that shares your curiosity."
          action={
            <Button
              onClick={() =>
                toast({
                  title: "Ready to explore",
                  description: "This is a component preview.",
                  tone: "info",
                })
              }
            >
              Explore clubs
            </Button>
          }
        />
        <ErrorState
          onRetry={() =>
            toast({
              title: "Retry requested",
              description: "Connect this callback to your service refresh.",
              tone: "info",
            })
          }
        />
      </div>
    </ShowcaseSection>
  );
}
