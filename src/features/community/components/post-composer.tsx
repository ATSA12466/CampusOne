"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ValidatedForm } from "@/components/shared/validated-form";
import { AttachmentPicker } from "@/features/workspace/components/attachment-picker";
import { postInputSchema } from "@/services/validation/social.schema";
import type { SocialPost } from "@/types/social";
export function PostComposer({
  owner,
  author,
  ready,
  busy,
  onSave,
}: {
  owner: string;
  author: string;
  ready: boolean;
  busy: boolean;
  onSave: (post: SocialPost) => Promise<void>;
}) {
  const [photo, setPhoto] = useState(""),
    [nonce, setNonce] = useState(0);
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">
          What is on your mind?
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Demo updates stay with your private profile on this device. Do not
          share sensitive IDs, contact details or photographs without
          permission. Nothing is broadcast to other students.
        </p>
      </div>
      <AttachmentPicker
        photo={photo}
        onChange={setPhoto}
        disabled={!ready || busy}
      />
      <ValidatedForm
        key={`${owner}:${nonce}`}
        schema={postInputSchema}
        initial={{ body: "", topic: "Campus life" }}
        disabled={!ready || busy}
        fields={[
          {
            name: "body",
            label: "Community post",
            type: "textarea",
            placeholder:
              "A useful idea, a little question, a good campus moment…",
            maxLength: 3000,
          },
          {
            name: "topic",
            label: "Post topic",
            type: "select",
            options: [
              "Campus life",
              "Study",
              "Clubs",
              "Events",
              "Opportunities",
            ],
          },
        ]}
        submitLabel="Post update"
        onSubmit={async (fields) => {
          await onSave({
            ...fields,
            id: crypto.randomUUID(),
            author,
            createdAt: new Date().toISOString(),
            ...(photo ? { photo } : {}),
          });
          setPhoto("");
          setNonce((n) => n + 1);
        }}
      />
      {!ready ? (
        <p className="text-sm text-muted-foreground">
          Sign in before creating your private demo update.
        </p>
      ) : null}
    </Card>
  );
}
