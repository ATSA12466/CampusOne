import { PhotoTile } from "@/components/media/photo-tile";
import { homeShortcuts } from "@/config/home";
import { images } from "@/config/images";
export function QuickActions() {
  return (
    <section aria-labelledby="home-shortcuts-title" className="min-w-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-[0.16em] text-brand uppercase">
            Make it your campus
          </p>
          <h2 id="home-shortcuts-title" className="font-display text-2xl font-semibold">
            A different kind of shortcut.
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">Swipe or scroll to explore</p>
      </div>
      <div
        role="region"
        aria-label="Photo shortcuts"
        tabIndex={0}
        className="-mx-1 grid grid-flow-col auto-cols-[minmax(10rem,1fr)] snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain rounded-control p-1 [scrollbar-width:thin]"
      >
        {homeShortcuts.map((item) => (
          <PhotoTile
            key={item.href}
            image={images[item.image]}
            sizes="160px"
            title={item.title}
            description={item.description}
            href={item.href}
            className="min-h-44 snap-start [&_h3]:text-xl [&_p]:text-xs"
          />
        ))}
      </div>
    </section>
  );
}
