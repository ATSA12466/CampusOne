"use client";
import { useState, useRef } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ValidatedForm } from "@/components/shared/validated-form";
import { levels } from "@/config/onboarding";
import { profileInputSchema } from "@/services/validation/profile.schema";
import type { ProfilePreferences } from "@/types/profile";
export function ProfileEditor({
  profile,
  busy,
  onSave,
}: {
  profile: ProfilePreferences;
  busy: boolean;
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
      title="Make it yours"
      description="Name, interests and privacy preferences are local demo settings, not university records or a public-profile publication."
      trigger={
        <Button ref={trigger} variant="secondary">
          Edit profile
        </Button>
      }
    >
      <ValidatedForm
        schema={profileInputSchema}
        disabled={busy}
        initial={{
          name: profile.name,
          programme: profile.programme,
          level: profile.level,
          bio: profile.bio,
          interests: profile.interests,
          visibility: profile.visibility,
          showProgramme: profile.showProgramme,
        }}
        fields={[
          { name: "name", label: "Preferred name", maxLength: 80 },
          { name: "programme", label: "Programme", maxLength: 120 },
          { name: "level", label: "Level", type: "select", options: levels },
          { name: "bio", label: "About you", type: "textarea", maxLength: 500 },
          {
            name: "interests",
            label: "Interests",
            placeholder: "Robotics, music, volunteering…",
            maxLength: 240,
          },
          {
            name: "visibility",
            label: "Profile visibility preference",
            type: "select",
            options: ["private", "campus-preview"],
          },
          {
            name: "showProgramme",
            label: "Show programme on your profile card",
            type: "select",
            options: ["yes", "no"],
          },
        ]}
        submitLabel="Save profile"
        onSubmit={async (fields) => {
          await onSave({ ...profile, ...fields });
          setOpen(false);
        }}
      />
    </Dialog>
  );
}
