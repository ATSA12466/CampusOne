"use client";

import { useId } from "react";
import { Select } from "@/components/ui/select";
import type { CropSettings } from "@/types/media";

export function UploadControls({
  crop,
  onChange,
  disabled,
}: {
  crop: CropSettings;
  onChange: (crop: CropSettings) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const sliders = [
    { key: "x", label: "Horizontal focus", min: 0, max: 100, step: 1 },
    { key: "y", label: "Vertical focus", min: 0, max: 100, step: 1 },
    { key: "zoom", label: "Zoom", min: 1, max: 3, step: 0.1 },
  ] as const;
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`${id}-aspect`} className="mb-1 block text-xs font-semibold">
          Crop shape
        </label>
        <Select
          id={`${id}-aspect`}
          disabled={disabled}
          value={String(crop.aspect)}
          onChange={(event) => onChange({ ...crop, aspect: Number(event.target.value) })}
        >
          <option value="1">Square · 1:1</option>
          <option value="0.8">Portrait · 4:5</option>
          <option value={String(16 / 9)}>Landscape · 16:9</option>
        </Select>
      </div>
      {sliders.map((slider) => (
        <div key={slider.key}>
          <div className="flex justify-between gap-3 text-xs">
            <label htmlFor={`${id}-${slider.key}`} className="font-semibold">
              {slider.label}
            </label>
            <output htmlFor={`${id}-${slider.key}`} className="text-muted-foreground">
              {crop[slider.key]}
              {slider.key === "zoom" ? "×" : "%"}
            </output>
          </div>
          <input
            id={`${id}-${slider.key}`}
            type="range"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={crop[slider.key]}
            disabled={disabled}
            onChange={(event) => onChange({ ...crop, [slider.key]: Number(event.target.value) })}
            className="h-11 w-full"
            style={{ accentColor: "var(--brand)" }}
          />
        </div>
      ))}
    </div>
  );
}
