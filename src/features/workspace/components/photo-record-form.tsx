"use client";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/media/image-uploader";
import { ValidatedForm } from "@/components/shared/validated-form";
import { photoRecordService } from "@/services";
import {
  photoRecordInputSchema,
  ownedPhotoSchema,
} from "@/services/validation/workspace.schema";
import type { PhotoRecord } from "@/types/photo-records";
export function PhotoRecordForm({
  kind,
  ready,
  busy,
  owner,
  onSave,
  existing,
}: {
  kind: "marketPosts" | "reports";
  ready: boolean;
  busy: boolean;
  owner: string;
  onSave: (r: PhotoRecord) => Promise<void>;
  existing?: PhotoRecord;
}) {
  const [photo, setPhoto] = useState(existing?.photo ?? ""),
    [open, setOpen] = useState(false),
    report = kind === "reports";
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={
        existing
          ? "Edit your device record"
          : report
            ? "Report a lost or found item"
            : "List a useful find"
      }
      description="Photo required. In demo mode this is stored with your current profile on this device, not broadcast to other students. Never post ID numbers or sensitive documents."
      trigger={
        <Button disabled={!ready}>
          {existing ? "Edit" : report ? "Create report" : "Create listing"}
        </Button>
      }
    >
      <ImageUploader
        label="Add the required photo"
        onComplete={async (p) => setPhoto(await photoRecordService.encode(p))}
        onRemove={() => setPhoto("")}
      />
      <p role="status" className="my-3 text-xs text-muted-foreground">
        {photo ? "Prepared photo attached." : "A prepared photo is required."}
      </p>
      <ValidatedForm
        key={owner}
        schema={photoRecordInputSchema}
        disabled={busy || !ready}
        initial={{
          title: existing?.title ?? "",
          description: existing?.description ?? "",
          category:
            existing?.category ??
            (report ? "Personal item" : "Student essentials"),
          location: existing?.location ?? "",
          priceValue: String(existing?.priceValue ?? 0),
          type: existing?.type ?? (report ? "lost" : "listing"),
        }}
        fields={[
          { name: "title", label: "Item name" },
          { name: "description", label: "Description", type: "textarea" },
          {
            name: "location",
            label: report ? "Last seen / found location" : "Collection area",
          },
          { name: "category", label: "Category" },
          {
            name: "type",
            label: "Report type",
            type: "select",
            options: report ? ["lost", "found"] : ["listing"],
          },
          {
            name: "priceValue",
            label: report ? "Reward in GH₵ (0 for none)" : "Price in GH₵",
            type: "number",
          },
        ]}
        submitLabel={report ? "Submit photo report" : "Save listing"}
        onSubmit={async (input) => {
          if (!ownedPhotoSchema.safeParse(photo).success)
            throw new Error("Prepare the required photo before submitting.");
          await onSave({
            ...input,
            id: existing?.id ?? crypto.randomUUID(),
            photo,
            createdAt: existing?.createdAt ?? new Date().toISOString(),
            status: existing?.status ?? "open",
          });
          setOpen(false);
        }}
      />
    </Dialog>
  );
}
