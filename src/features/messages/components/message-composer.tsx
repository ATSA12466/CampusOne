"use client";
import { useState } from "react";
import { ValidatedForm } from "@/components/shared/validated-form";
import { AttachmentPicker } from "@/features/workspace/components/attachment-picker";
import { messageInputSchema } from "@/services/validation/social.schema";
import type { MessageRecord } from "@/types/social";
export function MessageComposer({
  conversationId,
  ready,
  busy,
  onSave,
}: {
  conversationId: string;
  ready: boolean;
  busy: boolean;
  onSave: (m: MessageRecord) => Promise<void>;
}) {
  const [photo, setPhoto] = useState(""),
    [nonce, setNonce] = useState(0);
  return (
    <div className="space-y-4 border-t border-border pt-5">
      <AttachmentPicker
        photo={photo}
        onChange={setPhoto}
        disabled={!ready || busy}
      />
      <ValidatedForm
        key={`${conversationId}:${nonce}`}
        schema={messageInputSchema}
        disabled={!ready || busy}
        fields={[
          {
            name: "body",
            label: "Message draft",
            type: "textarea",
            maxLength: 2000,
            placeholder: "A useful question, a quick hello…",
          },
        ]}
        submitLabel="Save private message"
        onSubmit={async (fields) => {
          await onSave({
            ...fields,
            id: crypto.randomUUID(),
            conversationId,
            author: "you",
            createdAt: new Date().toISOString(),
            ...(photo ? { photo } : {}),
          });
          setPhoto("");
          setNonce((n) => n + 1);
        }}
      />
      <p className="text-xs text-muted-foreground">
        Demo messages and photos are private device records, not delivered
        messages. A connected service must supply real delivery, read receipts,
        presence and real-time transport.
      </p>
    </div>
  );
}
