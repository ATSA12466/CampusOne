"use client";

import { useState } from "react";
import { BookOpen, Flame, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Stepper } from "@/components/ui/stepper";
import { StatTile } from "@/components/ui/stat-tile";
import { Timeline } from "@/components/ui/timeline";
import { CalendarCell } from "@/components/ui/calendar-cell";
import { Pagination } from "@/components/ui/pagination";
import { InfiniteList } from "@/components/ui/infinite-list";
import { ShowcaseSection } from "./showcase-section";

export function DataShowcase() {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("2026-10-10");
  const [page, setPage] = useState(2);
  const [visible, setVisible] = useState(2);
  return (
    <ShowcaseSection
      id="data"
      number="06"
      title="A little progress, every day."
      description="At-a-glance statistics, honest progress and timelines, reachable calendar cells, and explicit load-more controls instead of endless surprises."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Study streak"
          value="7 days"
          detail="One small session at a time"
          icon={Flame}
          tone="gold"
        />
        <StatTile
          label="Semester progress"
          value="64%"
          detail="A preview, not an official record"
          icon={GraduationCap}
        />
        <StatTile
          label="Resources saved"
          value={12}
          detail="Ready whenever you are"
          icon={BookOpen}
          tone="success"
        />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card padding="lg" className="space-y-7">
          <Progress value={64} label="Weekly study goal" />
          <Progress value={32} label="Course notes reviewed" size="sm" />
          <Stepper
            label="Request progress preview"
            steps={["Details", "Photo", "Review", "Done"]}
            current={step}
            onStepChange={setStep}
          />
          <div>
            <p className="mb-4 text-sm font-semibold">Calendar cells / October 2026</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {Array.from(
                { length: 7 },
                (_, index) => `2026-10-${String(index + 5).padStart(2, "0")}`,
              ).map((day) => (
                <CalendarCell
                  key={day}
                  date={day}
                  today={day === "2026-10-10"}
                  selected={day === date}
                  onSelect={() => setDate(day)}
                  events={
                    day === "2026-10-09"
                      ? ["Code circle"]
                      : day === "2026-10-10"
                        ? ["Revision"]
                        : []
                  }
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground" role="status">
              Selected: {date}
            </p>
          </div>
        </Card>
        <Card padding="lg" className="space-y-7">
          <Timeline
            label="Student request timeline preview"
            items={[
              {
                id: "sent",
                title: "Request received",
                description: "Your context is safely with the team.",
                date: "2026-10-08",
                status: "complete",
              },
              {
                id: "review",
                title: "Under review",
                description: "A representative is taking a closer look.",
                date: "2026-10-10",
                status: "current",
              },
              {
                id: "next",
                title: "An update, soon",
                description: "We'll keep you in the loop.",
                status: "upcoming",
              },
            ]}
          />
          <div className="border-t border-border pt-5">
            <Pagination page={page} totalPages={8} onPageChange={setPage} />
            <p className="mt-2 text-center text-xs text-muted-foreground" role="status">
              Page {page} of 8
            </p>
          </div>
          <InfiniteList
            label="Load more preview"
            items={[
              "A new community",
              "A useful resource",
              "Your next opportunity",
              "An event to remember",
            ].slice(0, visible)}
            getKey={(item) => item}
            renderItem={(item) => (
              <div className="rounded-control bg-surface-muted px-4 py-3 text-sm">{item}</div>
            )}
            hasMore={visible < 4}
            onLoadMore={() => setVisible((current) => current + 2)}
            empty={<p>No preview items.</p>}
          />
        </Card>
      </div>
    </ShowcaseSection>
  );
}
