"use client";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ValidatedForm } from "@/components/shared/validated-form";
import { concernInputSchema } from "@/services/validation/social.schema";
import type { SocialConcern } from "@/types/social";
export function ConcernDialog({
  targetId,
  area,
  disabled,
  onSave,
}: {
  targetId: string;
  area: "community" | "messages";
  disabled: boolean;
  onSave: (concern: SocialConcern) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Flag a concern"
      description="Save a private workspace concern draft. Demo mode keeps it on this device; API mode needs a connected service. Saving a record is not confirmation of moderator review and does not contact emergency services. For urgent danger, use the appropriate real support service."
      trigger={
        <Button size="sm" variant="ghost" disabled={disabled}>
          Save concern
        </Button>
      }
    >
      <ValidatedForm
        schema={concernInputSchema}
        initial={{ reason: "other", note: "" }}
        fields={[
          {
            name: "reason",
            label: "Concern reason",
            type: "select",
            options: ["spam", "harassment", "privacy", "other"],
          },
          {
            name: "note",
            label: "Why are you concerned?",
            type: "textarea",
            maxLength: 1500,
          },
        ]}
        submitLabel="Save concern draft"
        onSubmit={async (fields) => {
          await onSave({
            ...fields,
            id: crypto.randomUUID(),
            targetId,
            area,
            createdAt: new Date().toISOString(),
          });
          setOpen(false);
        }}
      />
    </Dialog>
  );
}
