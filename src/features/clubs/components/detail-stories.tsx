import { Check, HeartHandshake } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Gallery } from "@/components/media/gallery";
import { appConfig } from "@/config/app-config";
import { clubGallery } from "@/lib/clubs/media";
import { imageForSrc } from "@/config/images";
import type { Club } from "@/types";
export function DetailStories({ club }: { club: Club }) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="club-about">
        <p className="text-[10px] font-bold tracking-widest text-brand uppercase">
          The community story
        </p>
        <h2 id="club-about" className="mt-2 font-display text-2xl font-semibold">
          Good company. Shared curiosity.
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          {(club.details?.story ?? [club.description]).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
      <section
        aria-labelledby="club-goals"
        className="rounded-card border border-border bg-surface p-5"
      >
        <h2 id="club-goals" className="font-display text-xl font-semibold">
          What brings us together
        </h2>
        <ul className="mt-4 space-y-3">
          {club.objectives.map((goal) => (
            <li key={goal} className="flex items-start gap-3 text-sm">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <Check className="size-3.5" aria-hidden="true" />
              </span>
              <span>{goal}</span>
            </li>
          ))}
        </ul>
      </section>
      {club.details?.highlights.length ? (
        <section aria-labelledby="club-highlights">
          <h2 id="club-highlights" className="font-display text-xl font-semibold">
            A few things you could try
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {club.details.highlights.map((item) => (
              <div key={item} className="rounded-card border border-border bg-surface p-4">
                <HeartHandshake className="size-5 text-brand" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-semibold">{item}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  A small start, with people ready to help.
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {club.details?.leaders.length ? (
        <section aria-labelledby="club-leaders">
          <h2 id="club-leaders" className="font-display text-xl font-semibold">
            Meet the welcome crew
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            {appConfig.dataSource === "demo"
              ? "Fictional coordinators for this demo community."
              : "Community contacts supplied by this listing."}
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {club.details.leaders.map((leader) => (
              <li
                key={leader.name}
                className="flex items-center gap-3 rounded-card border border-border bg-surface p-4"
              >
                <Avatar
                  name={leader.name}
                  image={leader.avatar ? imageForSrc(leader.avatar) : undefined}
                />
                <div>
                  <h3 className="text-sm font-semibold">{leader.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{leader.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {clubGallery(club).length ? (
        <section aria-labelledby="club-gallery">
          <h2 id="club-gallery" className="font-display text-xl font-semibold">
            A little window into club life
          </h2>
          <p className="mt-2 mb-4 text-xs text-muted-foreground">
            {appConfig.dataSource === "demo"
              ? "Generated illustrative scenes, not evidence of real meetings or membership."
              : "Listing images; generated placeholders remain clearly labelled."}
          </p>
          <Gallery images={clubGallery(club)} label={`${club.name} photo gallery`} />
        </section>
      ) : null}
    </div>
  );
}
