"use client";
import type { RefObject } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ImageUploader } from "@/components/media/image-uploader";
import { useAuthStore } from "@/stores/auth-store";
export function PhotoEditor({
  open,
  onOpenChange,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      returnFocusRef={returnFocusRef}
      title="Your photo, for this visit"
      description="Optional local crop and compression. Nothing is uploaded or saved as a file in browser storage."
    >
      <ImageUploader
        label="Prepare a profile photo"
        submitLabel="Use photo for this visit"
        onComplete={(photo) => {
          useAuthStore.getState().setPhoto(photo);
          onOpenChange(false);
        }}
      />
    </Dialog>
  );
}
