"use client";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ValidatedForm } from "@/components/shared/validated-form";
import { replyInputSchema } from "@/services/validation/social.schema";
import type { SocialReply } from "@/types/social";
export function PostThread({
  postId,
  author,
  replies,
  suppliedCount,
  ready,
  busy,
  onSave,
}: {
  postId: string;
  author: string;
  replies: SocialReply[];
  suppliedCount: number;
  ready: boolean;
  busy: boolean;
  onSave: (reply: SocialReply) => Promise<void>;
}) {
  const [parentId, setParent] = useState<string | undefined>(),
    [nonce, setNonce] = useState(0);
  return (
    <Dialog
      title="A little conversation"
      description={`${suppliedCount} comments were supplied by the original listing; only your loaded private workspace replies appear here. They are not sent to other students.`}
      trigger={
        <Button size="sm" variant="secondary">
          Replies ({replies.length})
        </Button>
      }
    >
      <div className="mb-6 space-y-3">
        {replies.length ? (
          replies.map((reply) => (
            <article
              className={`rounded-control border border-border p-3 ${reply.parentId ? "ml-4" : ""}`}
              key={reply.id}
            >
              <p className="text-sm font-semibold">
                {reply.author}
                {reply.parentId ? " · nested reply" : ""}
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                {reply.body}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setParent(reply.id)}
              >
                Reply to {reply.author}
              </Button>
            </article>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No private replies in this view yet.
          </p>
        )}
      </div>
      {parentId ? (
        <div className="mb-3 flex items-center gap-3 text-xs">
          <span>Replying to a loaded comment</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setParent(undefined)}
          >
            Cancel nested reply
          </Button>
        </div>
      ) : null}
      <ValidatedForm
        key={nonce}
        schema={replyInputSchema}
        disabled={!ready || busy}
        fields={[
          {
            name: "body",
            label: "Your reply",
            type: "textarea",
            maxLength: 1500,
          },
        ]}
        submitLabel="Save private reply"
        onSubmit={async (fields) => {
          await onSave({
            ...fields,
            id: crypto.randomUUID(),
            postId,
            author,
            createdAt: new Date().toISOString(),
            ...(parentId ? { parentId } : {}),
          });
          setParent(undefined);
          setNonce((n) => n + 1);
        }}
      />
    </Dialog>
  );
}
