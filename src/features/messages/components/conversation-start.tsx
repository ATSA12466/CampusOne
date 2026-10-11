"use client";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ValidatedForm } from "@/components/shared/validated-form";
import { conversationInputSchema } from "@/services/validation/social.schema";
import type { PrivateConversation } from "@/types/social";
export function ConversationStart({
  ready,
  busy,
  onSave,
}: {
  ready: boolean;
  busy: boolean;
  onSave: (c: PrivateConversation) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Start a private demo conversation"
      description="This creates a local thread label, not a real contact or invitation. New messages are not delivered to another person in demo mode."
      trigger={
        <Button variant="secondary" disabled={!ready || busy}>
          Start a conversation
        </Button>
      }
    >
      <ValidatedForm
        schema={conversationInputSchema}
        fields={[{ name: "name", label: "Conversation name", maxLength: 80 }]}
        submitLabel="Create private thread"
        onSubmit={async (fields) => {
          await onSave({
            ...fields,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          });
          setOpen(false);
        }}
      />
    </Dialog>
  );
}
