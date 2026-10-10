import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundContent() {
  return (
    <section className="campus-card mx-auto w-full max-w-md p-8 text-center">
      <span className="mx-auto mb-6 grid size-16 place-items-center rounded-card bg-accent-soft text-warning">
        <Compass className="size-8" aria-hidden="true" />
      </span>
      <p className="mb-3 text-xs font-semibold tracking-widest text-brand">
        404 / A TURN OFF THE MAP
      </p>
      <h1 className="font-display text-3xl font-semibold">Page not found</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        This corner of campus isn’t here. It may have moved, or the link may have changed. Let’s get
        you back.
      </p>
      <Button asChild variant="secondary" className="mt-6">
        <Link href="/home">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Go back home
        </Link>
      </Button>
    </section>
  );
}
