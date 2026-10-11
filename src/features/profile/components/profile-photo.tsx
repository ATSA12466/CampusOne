"use client";
import { useState, useRef } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/media/image-uploader";
import { photoRecordService } from "@/services";
import { useAuthStore } from "@/stores/auth-store";
import type { ProfilePreferences } from "@/types/profile";
export function ProfilePhoto({
  profile,
  busy,
  owner,
  onSave,
}: {
  profile: ProfilePreferences;
  busy: boolean;
  owner: string;
  onSave: (profile: ProfilePreferences) => Promise<void>;
}) {
  const [open, setOpen] = useState(false),
    trigger = useRef<HTMLButtonElement>(null);
  return (
    <Dialog
      returnFocusRef={trigger}
      fallbackFocusSelector="#profile-identity-title"
      open={open}
      onOpenChange={setOpen}
      title="A familiar face"
      description="Crop and compress a photo you own. The demo stores the prepared image with this private device profile; it is not uploaded or shared with the university."
      trigger={
        <Button ref={trigger} disabled={busy} variant="secondary">
          Change profile photo
        </Button>
      }
    >
      <ImageUploader
        label="Prepare your profile photo"
        submitLabel="Save profile photo"
        onComplete={async (processed) => {
          const photo = await photoRecordService.encode(processed);
          await onSave({ ...profile, photo });
          const s = useAuthStore.getState();
          if (
            owner === `${s.source}:${s.user?.id}:${s.user?.email}:${s.role}`
          ) {
            s.setPhoto(processed);
            setOpen(false);
          }
        }}
      />
      {profile.photo ? (
        <Button
          className="mt-4"
          variant="secondary"
          disabled={busy}
          onClick={() =>
            void onSave({ ...profile, photo: undefined })
              .then(() => {
                useAuthStore.getState().clearPhoto();
                setOpen(false);
              })
              .catch(() => {})
          }
        >
          Remove saved photo
        </Button>
      ) : null}
    </Dialog>
  );
}
