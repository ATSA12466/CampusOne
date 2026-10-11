import type { ProcessedImage } from "@/types/media";
import { ownedPhotoSchema } from "@/services/validation/workspace.schema";
export const photoRecordService = {
  async encode(photo: ProcessedImage): Promise<string> {
    if (photo.file.size > 512 * 1024)
      throw new Error("Use a compressed image of at most 512 KB.");
    const value = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () =>
        reject(new Error("The prepared photo could not be read."));
      reader.onload = () =>
        typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("Invalid photo output."));
      reader.readAsDataURL(photo.file);
    });
    return ownedPhotoSchema.parse(value);
  },
};
