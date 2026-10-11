"use client";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/media/image-uploader";
import { photoRecordService } from "@/services";
export function AttachmentPicker({
  photo,
  onChange,
  disabled = false,
}: {
  photo: string;
  onChange: (photo: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Add an owned photo"
        description="Prepare only a photo you have permission to share. In the demo it is stored privately on this device, not sent to another person."
        trigger={
          <Button variant="secondary" disabled={disabled}>
            {photo ? "Replace photo" : "Add photo"}
          </Button>
        }
      >
        <ImageUploader
          label="Photo attachment"
          onComplete={async (p) => {
            onChange(await photoRecordService.encode(p));
            setOpen(false);
          }}
        />
      </Dialog>
      {photo ? (
        <>
          <span className="text-xs text-muted-foreground">
            Prepared photo attached
          </span>
          <Button
            variant="ghost"
            disabled={disabled}
            onClick={() => onChange("")}
          >
            Remove attachment
          </Button>
        </>
      ) : null}
    </div>
  );
}
