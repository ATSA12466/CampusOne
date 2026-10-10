"use client";

import { Button } from "@/components/ui";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="campus-card max-w-md p-6 text-center">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">CampusOne encountered an unexpected error. Please try again.</p>
        <Button className="mt-4" onClick={reset}>Retry</Button>
      </div>
    </main>
  );
}
