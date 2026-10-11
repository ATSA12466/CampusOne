"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { usePrivateCatalog } from "@/features/campus-feed/hooks/use-private-catalog";
import { useWorkspace } from "@/features/workspace/hooks/use-workspace";
import { ConversationStart } from "./conversation-start";
import { MessageThread } from "./message-thread";
export function OwnedMessages() {
  const source = usePrivateCatalog("conversations"),
    threads = useWorkspace("conversations"),
    messages = useWorkspace("messages"),
    [selected, setSelected] = useState(() =>
      typeof window === "undefined"
        ? ""
        : (new URLSearchParams(location.search).get("conversation") ?? ""),
    ),
    [query, setQuery] = useState("");
  const all = [
      ...threads.items.map((t) => ({
        id: t.id,
        name: t.name,
        lastMessage:
          "Private demo thread. Nothing has been sent to another person.",
        updatedAt: "Created on this device",
      })),
      ...source.items,
    ],
    active = all.find((c) => c.id === selected),
    error = source.error || threads.error || messages.error;
  const choose = (id: string) => {
    setSelected(id);
    const url = new URL(location.href);
    url.searchParams.set("conversation", id);
    history.replaceState(null, "", url);
  };
  return (
    <div className="space-y-5">
      {error ? (
        <div role="alert" className="rounded-card bg-surface-muted p-4">
          <p>{error}</p>
          <Button
            onClick={() => {
              source.refresh();
              threads.refresh();
              messages.refresh();
            }}
          >
            Retry conversations
          </Button>
        </div>
      ) : null}
      {messages.notice ? (
        <p role="status" className="text-xs text-muted-foreground">
          {messages.notice}
        </p>
      ) : null}
      <div className="grid items-start gap-5 lg:grid-cols-[300px_1fr]">
        <Card className="space-y-4">
          <ConversationStart
            ready={threads.ready && !error}
            busy={threads.busy}
            onSave={async (t) => {
              await threads.put(t);
              choose(t.id);
            }}
          />
          <Input
            aria-label="Search conversations"
            placeholder="Find your people…"
            value={query}
            maxLength={120}
            onChange={(e) => setQuery(e.target.value)}
          />
          {source.loading || threads.loading ? (
            <p role="status">Loading your conversation previews…</p>
          ) : null}
          <ul className="space-y-2">
            {all
              .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
              .map((c) => (
                <li key={c.id}>
                  <button
                    aria-pressed={c.id === selected}
                    className="flex min-h-16 w-full items-center gap-3 rounded-control border border-border p-3 text-left aria-pressed:bg-brand-soft"
                    onClick={() => choose(c.id)}
                  >
                    <Avatar name={c.name} />
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-semibold">
                        {c.name}
                      </span>
                      <span className="line-clamp-1 text-xs text-muted-foreground">
                        {messages.items.find((m) => m.conversationId === c.id)
                          ?.body ?? c.lastMessage}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Supplied previews and your private workspace threads. Demo names are
            fictional; no real contacts are looked up.
          </p>
        </Card>
        {active ? (
          <MessageThread
            conversation={active}
            messages={messages.items
              .filter((m) => m.conversationId === active.id)
              .sort((a, b) => a.createdAt.localeCompare(b.createdAt))}
            ready={messages.ready && !error}
            busy={messages.busy}
            onSave={messages.put}
          />
        ) : (
          <Card>
            <h2 className="font-display text-2xl">Select a conversation.</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Choose a supplied preview or start a private workspace thread. No
              messages are fetched across profiles.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
