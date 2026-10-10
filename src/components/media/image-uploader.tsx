"use client";

import { Camera, Upload } from "lucide-react";
import { useId, useRef, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadPreview } from "./upload-preview";
import { useImageUploader } from "./hooks/use-image-uploader";
import type { ProcessedImage } from "@/types/media";

export function ImageUploader({
  label = "Add a photo",
  onComplete,
  submitLabel = "Use this photo",
  onRemove,
}: {
  label?: string;
  onComplete: (image: ProcessedImage) => Promise<void> | void;
  submitLabel?: string;
  onRemove?: () => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const {
    source,
    crop,
    busy,
    reading,
    progress,
    error,
    complete,
    choose,
    save,
    changeCrop,
    remove,
  } = useImageUploader(onComplete);
  const drop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    void choose(event.dataTransfer.files[0]);
  };
  return (
    <section
      aria-label={label}
      className="min-w-0 space-y-4"
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={drop}
    >
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          void choose(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {source ? (
        <UploadPreview
          source={source}
          crop={crop}
          disabled={busy || reading}
          onCropChange={changeCrop}
          onRemove={() => {
            remove();
            onRemove?.();
          }}
        />
      ) : (
        <div className="flex flex-col items-center rounded-media border-2 border-dashed border-border bg-surface-muted px-5 py-8 text-center">
          <span className="mb-4 grid size-14 place-items-center rounded-full bg-surface">
            <Camera className="size-6 text-brand" aria-hidden="true" />
          </span>
          <h3 className="font-semibold">{label}</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            Choose a JPG, PNG or WebP, up to 12 MB.
            <br />
            Drag and drop works too.
          </p>
          <Button
            variant="secondary"
            className="mt-5"
            disabled={reading}
            onClick={() => input.current?.click()}
          >
            {reading ? "Opening photo…" : "Choose photo"}
          </Button>
        </div>
      )}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="rounded-control bg-danger-soft p-3 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}
      {source ? (
        <div className="space-y-3">
          {busy ? <Progress value={progress} label="Preparing photo" /> : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={busy || reading || complete}
              onClick={() => void save()}
              aria-describedby={error ? `${id}-error` : `${id}-privacy`}
            >
              <Upload className="size-4" aria-hidden="true" />
              {busy ? "Preparing…" : complete ? "Photo ready" : error ? "Try again" : submitLabel}
            </Button>
            <Button
              variant="ghost"
              disabled={busy || reading}
              onClick={() => input.current?.click()}
            >
              Choose another
            </Button>
          </div>
          <p id={`${id}-privacy`} className="text-[11px] text-muted-foreground">
            Cropped locally, compressed to at most 512 KB, and location metadata removed. Connect
            the service callback for a real upload.
          </p>
        </div>
      ) : null}
      <p className="sr-only" role="status">
        {reading
          ? "Opening your photo"
          : complete
            ? "Photo prepared successfully"
            : busy
              ? "Preparing your photo"
              : ""}
      </p>
    </section>
  );
}
