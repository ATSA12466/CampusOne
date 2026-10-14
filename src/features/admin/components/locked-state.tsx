"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LockedState({ area }: { area: string }) {
  const pathname = usePathname();
  return (
    <Card className="mx-auto max-w-lg px-6 py-10 text-center" padding="lg">
      <span className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-warning-soft text-warning">
        <ShieldAlert className="size-7" aria-hidden="true" />
      </span>
      <h1 className="font-display text-2xl">Restricted area</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        {area} is available to authorised accounts only. Sign in with an account that has the
        right permissions, or return to the student app.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link prefetch={false} href={`/sign-in?next=${encodeURIComponent(pathname)}`}>
            Sign in
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link prefetch={false} href="/home">
            Back to CampusOne
          </Link>
        </Button>
      </div>
    </Card>
  );
}
