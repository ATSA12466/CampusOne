"use client";
import Link from "next/link";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { Badge, Card } from "@/components/ui";
import { images } from "@/config/images";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types";
const scopes: Record<
  UserRole,
  { title: string; description: string; href: string }[]
> = {
  student: [
    {
      title: "Your study workspace",
      description: "Private tasks, plans and resources.",
      href: "/tasks",
    },
    {
      title: "Your participation",
      description:
        "Membership decisions and event plans, not official attendance.",
      href: "/participation",
    },
  ],
  "club-executive": [
    {
      title: "Membership reviews",
      description:
        "Review demo requests in the preserved club executive panel.",
      href: "/clubs",
    },
    {
      title: "Event planning",
      description: "Browse the current event catalog and RSVP states.",
      href: "/events",
    },
  ],
  "committee-member": [
    {
      title: "Student projects",
      description: "Read supplied responsibilities and project states.",
      href: "/src-office",
    },
  ],
  "src-representative": [
    {
      title: "Student request workspace",
      description:
        "Local drafts and supplied project status; not an official triage system.",
      href: "/src-office",
    },
  ],
  administrator: [
    {
      title: "Campaign overview",
      description:
        "Read supplied placements; publishing/billing are not connected.",
      href: "/advertising",
    },
    {
      title: "Account preferences",
      description: "Appearance, privacy boundaries and session actions.",
      href: "/settings",
    },
  ],
};
export function ManagementFeature() {
  const role = useAuthStore((s) => s.role),
    user = useAuthStore((s) => s.user);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <MagazineHeader
        eyebrow="A PLACE FOR RESPONSIBILITY"
        title="Clear roles. Thoughtful work."
        description="Find the existing workspaces relevant to your current profile."
        image={images.clubMakers}
      />
      <Card>
        <h2 className="font-display text-xl font-semibold">
          {user ? "Current role scope" : "Sign in to see your workspace"}
        </h2>
        <Badge className="mt-3" tone="primary">
          {user ? role : "Guest"}
        </Badge>
        <p className="mt-4 text-sm text-muted-foreground">
          Demo role selection is not university authority. Connected APIs must
          enforce authentication, club scope, permissions and audit logs
          independently.
        </p>
      </Card>
      <div className="grid gap-5 sm:grid-cols-2">
        {(user
          ? scopes[role]
          : [
              {
                title: "Sign in",
                description:
                  "Restore the profile attached to the active source.",
                href: "/sign-in?next=%2Fmanagement",
              },
            ]
        ).map((i) => (
          <Card key={i.href}>
            <h2 className="font-display text-xl font-semibold">{i.title}</h2>
            <p className="my-4 text-sm text-muted-foreground">
              {i.description}
            </p>
            <Link
              className="inline-flex min-h-11 items-center text-sm font-semibold text-brand"
              href={i.href}
            >
              Open workspace →
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
