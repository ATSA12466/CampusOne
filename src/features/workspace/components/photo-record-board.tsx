"use client";
import { useWorkspace } from "../hooks/use-workspace";
import { PhotoRecordForm } from "./photo-record-form";
import { OwnedPhoto } from "@/components/media/owned-photo";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
export function PhotoRecordBoard({
  collection,
}: {
  collection: "marketPosts" | "reports";
}) {
  const workspace = useWorkspace(collection);
  return (
    <section className="space-y-4" aria-label="Your device-only photo records">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">
          {collection === "reports" ? "Your reports." : "Your own listings."}
        </h2>
        <PhotoRecordForm
          key={workspace.owner}
          kind={collection}
          ready={workspace.ready}
          busy={workspace.busy}
          owner={workspace.owner}
          onSave={workspace.put}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {!workspace.ready
          ? "Sign in to create or view your device records."
          : "Private demo workspace on this device; not a campus-wide publication or real message. Uploaded photos remain with this local profile until cleared or signed out."}
      </p>
      {workspace.error ? (
        <ErrorState
          title="Your records could not load"
          description={workspace.error}
          onRetry={workspace.refresh}
        />
      ) : workspace.loading ? (
        <p role="status">Loading your records…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workspace.items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-media border border-border bg-surface p-4"
            >
              <OwnedPhoto
                data={item.photo}
                alt={`Your prepared photo of ${item.title}`}
              />
              <h3 className="mt-4 font-display text-xl font-semibold">
                {item.title}
              </h3>
              <p className="mt-2 text-sm">{item.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {item.type} · {item.location} · {item.status}
                {item.priceValue ? ` · GH₵ ${item.priceValue}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <PhotoRecordForm
                  key={workspace.owner + item.id}
                  existing={item}
                  kind={collection}
                  ready={workspace.ready}
                  busy={workspace.busy}
                  owner={workspace.owner}
                  onSave={workspace.put}
                />
                <Button
                  variant="secondary"
                  disabled={workspace.busy}
                  onClick={() =>
                    void workspace
                      .put({
                        ...item,
                        status: item.status === "open" ? "closed" : "open",
                      })
                      .catch(() => {})
                  }
                >
                  {item.status === "open" ? "Mark closed" : "Reopen"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={workspace.busy}
                  onClick={() => {
                    if (
                      confirm("Delete this device-only record and its photo?")
                    )
                      void workspace.remove(item.id).catch(() => {});
                  }}
                >
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {workspace.notice ? (
        <p
          role="status"
          className="rounded-control bg-surface-muted p-3 text-sm"
        >
          {workspace.notice}
        </p>
      ) : null}
    </section>
  );
}
