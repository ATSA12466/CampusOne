"use client";
import Link from "next/link";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { Card } from "@/components/ui/card";
import { images } from "@/config/images";
import { useAuthStore } from "@/stores/auth-store";
import { OwnedMessages } from "./components/message-directory";
export function MessagesFeature() {
  const owner = useAuthStore((s) =>
    s.user && s.hydrated
      ? `${s.source}:${s.user.id}:${s.user.email}:${s.role}`
      : "",
  );
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <MagazineHeader
        eyebrow="A LITTLE CONNECTION"
        title="Good conversations start here."
        description="Make room for your study circle, your project team and the people who make campus feel like home."
        image={images.clubDebate}
      />
      {owner ? (
        <OwnedMessages key={owner} />
      ) : (
        <Card>
          <h2 className="font-display text-2xl">
            Your conversations are private.
          </h2>
          <Link
            href="/sign-in?next=%2Fmessages"
            className="mt-4 inline-flex min-h-11 items-center text-brand"
          >
            Sign in to open messages
          </Link>
        </Card>
      )}
    </div>
  );
}
