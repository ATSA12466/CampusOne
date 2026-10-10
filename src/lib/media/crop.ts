import type { CropRectangle, CropSettings } from "@/types/media";

export function cropRectangle(
  width: number,
  height: number,
  settings: CropSettings,
): CropRectangle {
  if (
    ![width, height, settings.x, settings.y, settings.zoom, settings.aspect].every(
      Number.isFinite,
    ) ||
    width <= 0 ||
    height <= 0 ||
    settings.aspect <= 0
  )
    throw new Error("Invalid photo dimensions");
  const zoom = Math.max(1, Math.min(3, settings.zoom));
  const baseWidth = Math.min(width, height * settings.aspect);
  const cropWidth = baseWidth / zoom;
  const cropHeight = Math.min(height, cropWidth / settings.aspect);
  return {
    x: ((width - cropWidth) * Math.max(0, Math.min(100, settings.x))) / 100,
    y: ((height - cropHeight) * Math.max(0, Math.min(100, settings.y))) / 100,
    width: cropWidth,
    height: cropHeight,
  };
}
