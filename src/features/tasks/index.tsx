"use client";
import Link from "next/link";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { Card } from "@/components/ui/card";
import { images } from "@/config/images";
import { useAuthStore } from "@/stores/auth-store";
import { TaskDirectory } from "./components/task-directory";
export function TasksFeature() {
  const owner = useAuthStore((s) =>
    s.user && s.hydrated
      ? `${s.source}:${s.user.id}:${s.user.email}:${s.role}`
      : "",
  );
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <MagazineHeader
        eyebrow="A LITTLE FOCUS GOES A LONG WAY"
        title="Make room for what matters."
        description="The big assignment. The little errand. Your next good idea. Give your day a plan that feels like yours."
        image={images.studyCorner}
      />
      {owner ? (
        <TaskDirectory key={owner} />
      ) : (
        <Card>
          <h2 className="font-display text-2xl">Your task list is private.</h2>
          <Link
            href="/sign-in?next=%2Ftasks"
            className="mt-3 inline-flex min-h-11 items-center text-brand"
          >
            Sign in to open your tasks
          </Link>
        </Card>
      )}
    </div>
  );
}
