import { CampusImage } from "@/components/media/campus-image";
import type { CampusMedia } from "@/types/media";
export function PhotoStory({
  image,
  eyebrow,
  title,
  description,
}: {
  image: CampusMedia;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <aside className="auth-photo-story" aria-label="CampusOne photo story">
      <CampusImage
        image={image}
        aspect="portrait"
        quality={60}
        priority
        sizes="(max-width:1023px) calc(100vw - 2rem), 48vw"
        className="auth-story-media absolute inset-0 h-full w-full aspect-auto"
      />
      <div className="photo-scrim absolute inset-0" aria-hidden="true" />
      <div className="auth-story-content relative z-10 flex flex-col justify-between p-6 text-on-photo md:p-9 lg:p-10">
        <span className="self-start rounded-full border border-on-photo/35 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em]">
          GCTU · STUDENT LIFE
        </span>
        <div className="mt-14 lg:mt-32">
          <p className="mb-3 text-[10px] font-bold tracking-[0.18em]">{eyebrow}</p>
          <h2 className="max-w-lg font-display text-[clamp(2rem,4.3vw,4.5rem)] leading-[1.06] font-semibold tracking-tight text-balance">
            {title}
          </h2>
          <p className="mt-4 max-w-md text-sm text-on-photo/90 lg:text-base">{description}</p>
          <p className="mt-6 text-[10px] text-on-photo/90">
            Generated demo scene · fictional people, not GCTU photography.
          </p>
        </div>
      </div>
    </aside>
  );
}
