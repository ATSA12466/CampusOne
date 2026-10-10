"use client";

import { useEffect, useState } from "react";
import { ImageUploader } from "@/components/media/image-uploader";
import { CampusImage } from "@/components/media/campus-image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { formatBytes } from "@/lib/media/compress";
import type { CampusMedia, ProcessedImage } from "@/types/media";
import { ShowcaseSection } from "./showcase-section";

export function UploadShowcase() {
  const [result, setResult] = useState<{ prepared: ProcessedImage; preview: CampusMedia } | null>(
    null,
  );
  const [simulateFailure, setSimulateFailure] = useState(false);
  const toast = useToast();
  useEffect(() => {
    const url = result?.preview.src;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [result]);
  return (
    <ShowcaseSection
      id="uploads"
      number="08"
      title="A photo, without the heavy lifting."
      description="Choose, preview, crop and compress on your device. Keyboard-friendly focus and zoom controls. A validated JPEG ready for a swappable upload adapter."
    >
      <div className="grid gap-5 lg:grid-cols-5">
        <Card padding="lg" className="lg:col-span-3">
          <ImageUploader
            label="Make it yours"
            onRemove={() => setResult(null)}
            onComplete={(prepared) => {
              if (simulateFailure)
                throw new Error(
                  "The preview callback failed. Your photo is still here — try again.",
                );
              setResult({
                prepared,
                preview: {
                  src: URL.createObjectURL(prepared.file),
                  alt: "Your compressed photo preview",
                  width: prepared.width,
                  height: prepared.height,
                  provenance: "upload",
                },
              });
              toast({
                title: "Photo ready",
                description: `${formatBytes(prepared.file.size)} — prepared locally, not uploaded.`,
                tone: "success",
              });
            }}
          />
          <div className="mt-6 border-t border-border pt-4">
            <Checkbox
              label="Simulate a callback failure"
              description="Test retry behavior. No network request is made."
              checked={simulateFailure}
              onCheckedChange={(next) => setSimulateFailure(next === true)}
            />
          </div>
        </Card>
        <Card padding="lg" className="lg:col-span-2">
          {result ? (
            <>
              <Badge tone="success">Ready for upload</Badge>
              <CampusImage
                image={result.preview}
                aspect="square"
                fit="contain"
                className="mt-5 rounded-media"
                sizes="400px"
              />
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Original</dt>
                  <dd className="font-semibold">{formatBytes(result.prepared.originalBytes)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Prepared</dt>
                  <dd className="font-semibold">{formatBytes(result.prepared.file.size)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Dimensions</dt>
                  <dd>
                    {result.prepared.width} × {result.prepared.height}
                  </dd>
                </div>
              </dl>
              <a
                href={result.preview.src}
                download={result.prepared.file.name}
                className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4"
              >
                Download prepared photo
              </a>
            </>
          ) : (
            <>
              <Badge tone="neutral">Private by default</Badge>
              <h3 className="mt-5 font-display text-2xl font-semibold">Your photo stays here.</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                This showcase holds the image only in this tab. It does not persist binary data,
                call an upload service or claim a successful backend upload.
              </p>
              <ul className="mt-5 space-y-3 text-xs text-muted-foreground">
                <li>Up to 12 MB input · JPG, PNG, WebP</li>
                <li>At most 1600 px / 512 KB output</li>
                <li>Location metadata stripped by re-encoding</li>
                <li>Object URLs released when replaced</li>
              </ul>
            </>
          )}
        </Card>
      </div>
    </ShowcaseSection>
  );
}
