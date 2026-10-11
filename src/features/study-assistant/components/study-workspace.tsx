"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWorkspace } from "@/features/workspace/hooks/use-workspace";
import { studyPlannerService } from "@/services";
import type { StudyPlan } from "@/types/study-planner";
import { StudyForm } from "./study-form";
import { StudyResult } from "./study-result";
export function StudyWorkspace() {
  const saved = useWorkspace("studyPlans"),
    [plan, setPlan] = useState<StudyPlan | null>(null),
    [error, setError] = useState("");
  return (
    <section className="space-y-6">
      <StudyForm
        disabled={!saved.ready || saved.loading || !!saved.error}
        onGenerate={async (input) => {
          setError("");
          try {
            setPlan(await studyPlannerService.generate(input));
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "The draft could not be prepared.",
            );
          }
        }}
      />
      {saved.error || error ? (
        <div role="alert">
          <p>{saved.error || error}</p>
          <Button onClick={saved.refresh}>Retry study workspace</Button>
        </div>
      ) : null}
      {saved.notice ? (
        <p role="status" className="text-xs text-muted-foreground">
          {saved.notice}
        </p>
      ) : null}
      {plan ? (
        <div className="space-y-3">
          <h2 className="font-display text-2xl">Your prepared week</h2>
          <StudyResult
            plan={plan}
            busy={saved.busy}
            onSave={async () => {
              await saved.put(plan);
            }}
          />
        </div>
      ) : (
        <Card>
          <h2 className="font-display text-2xl">
            A little structure, a little breathing room.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose your availability and prepare a focused seven-day draft. No
            AI request is made and no notes are sent to an AI provider.
          </p>
        </Card>
      )}
      <div className="space-y-4">
        <h2 className="font-display text-2xl">
          Your saved drafts ({saved.items.length})
        </h2>
        <p className="text-xs text-muted-foreground">
          Showing the latest {Math.min(saved.items.length, 6)} of your loaded
          private workspace drafts. Demo records stay on this device; API mode
          requires a connected service.
        </p>
        {[...saved.items]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 6)
          .map((item) => (
            <StudyResult
              key={item.id}
              plan={item}
              busy={saved.busy}
              onRemove={async () => {
                await saved.remove(item.id);
              }}
            />
          ))}
      </div>
    </section>
  );
}
