import type { LocalPhotoService } from "@/types/auth";
let current: string | undefined;
export const localPhotoService: LocalPhotoService = {
  create(photo, name) {
    this.release();
    current = URL.createObjectURL(photo.file);
    return {
      src: current,
      alt: `${name}'s locally prepared profile photo, for this visit only`,
      width: photo.width,
      height: photo.height,
      provenance: "upload",
      sourceNote: "Cropped locally. No server upload or persistent file storage.",
    };
  },
  release() {
    if (current) URL.revokeObjectURL(current);
    current = undefined;
  },
};
