"use client";
import { Card } from "@/components/ui/card";
import { OwnedPhoto } from "@/components/media/owned-photo";
import { MessageComposer } from "./message-composer";
import type { Conversation } from "@/types/community";
import type { MessageRecord } from "@/types/social";
export function MessageThread({
  conversation,
  messages,
  ready,
  busy,
  onSave,
}: {
  conversation: Conversation;
  messages: MessageRecord[];
  ready: boolean;
  busy: boolean;
  onSave: (m: MessageRecord) => Promise<void>;
}) {
  return (
    <Card className="min-w-0 space-y-6">
      <header className="border-b border-border pb-4">
        <h2 className="break-words font-display text-2xl font-semibold">
          {conversation.name}
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Private workspace thread · no real-time presence or delivery
          confirmation.
        </p>
      </header>
      <div aria-label="Conversation history" className="space-y-4">
        <blockquote className="max-w-md rounded-card bg-surface-muted p-4 text-sm">
          <p>{conversation.lastMessage}</p>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Supplied preview label: {conversation.updatedAt}. This is not a live
            received timestamp.
          </p>
        </blockquote>
        {messages.map((m) => (
          <article
            key={m.id}
            className="ml-auto max-w-md space-y-3 rounded-card border border-border bg-brand-soft p-4"
          >
            <p className="text-xs font-semibold">
              You · private workspace record
            </p>
            {m.photo ? (
              <OwnedPhoto
                data={m.photo}
                alt="Your privately stored message photo attachment"
              />
            ) : null}
            <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
            <time
              dateTime={m.createdAt}
              className="block text-[10px] text-muted-foreground"
            >
              {new Intl.DateTimeFormat("en-GH", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                timeZone: "Africa/Accra",
              }).format(new Date(m.createdAt))}
            </time>
          </article>
        ))}
      </div>
      <MessageComposer
        key={conversation.id}
        conversationId={conversation.id}
        ready={ready}
        busy={busy}
        onSave={onSave}
      />
    </Card>
  );
}
