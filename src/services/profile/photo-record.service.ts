import type { ProcessedImage } from "@/types/media";
export const photoRecordService = {
  async encode(photo: ProcessedImage) {
    return (await import("./photo-record-actions")).photoRecordService.encode(
      photo,
    );
  },
};
