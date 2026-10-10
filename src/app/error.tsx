"use client";
import { ErrorState } from "@/components/shared/error-state";
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <ErrorState title="A small pause, not a dead end." onRetry={reset} heading="h1" />
    </main>
  );
}
