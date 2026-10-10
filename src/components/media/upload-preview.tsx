"use client";

import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampusImage } from "./campus-image";
import { UploadControls } from "./upload-controls";
import { defaultCrop } from "./hooks/use-image-uploader";
import { formatBytes } from "@/lib/media/compress";
import type { CampusMedia, CropSettings } from "@/types/media";

export function UploadPreview({
  source,
  crop,
  disabled,
  onCropChange,
  onRemove,
}: {
  source: { file: File; image: CampusMedia };
  crop: CropSettings;
  disabled: boolean;
  onCropChange: (crop: CropSettings) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <CampusImage
          image={source.image}
          aspect={crop.aspect === 1 ? "square" : crop.aspect === 0.8 ? "portrait" : "video"}
          className="rounded-media"
          focalPoint={{ x: crop.x, y: crop.y }}
          imageStyle={{
            transform: `scale(${crop.zoom})`,
            transformOrigin: `${crop.x}% ${crop.y}%`,
          }}
          sizes="(max-width: 767px) 100vw, 400px"
        />
        <p className="mt-2 truncate text-xs text-muted-foreground">
          {source.file.name} · {formatBytes(source.file.size)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onCropChange(defaultCrop)}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset crop
          </Button>
          <Button variant="ghost" size="sm" disabled={disabled} onClick={onRemove}>
            <X className="size-4" aria-hidden="true" />
            Remove
          </Button>
        </div>
      </div>
      <UploadControls crop={crop} onChange={onCropChange} disabled={disabled} />
    </div>
  );
}
