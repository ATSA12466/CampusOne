"use client";

import * as Primitive from "@radix-ui/react-toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import type { ToastMessage } from "@/types/ui";
import { cva } from "class-variance-authority";
import { Button } from "./button";

const variants = cva(
  "toast-enter flex items-start gap-3 rounded-card border border-border bg-surface-raised p-4 text-foreground shadow-overlay",
  {
    variants: { tone: { success: "", danger: "border-danger/40", info: "" } },
    defaultVariants: { tone: "info" },
  },
);
export function ToastStack({
  messages,
  onDismiss,
}: {
  messages: readonly (ToastMessage & { id: string })[];
  onDismiss: (id: string) => void;
}) {
  return (
    <Primitive.Provider duration={4500} swipeDirection="right">
      {messages.map((message) => {
        const Icon =
          message.tone === "success"
            ? CheckCircle2
            : message.tone === "danger"
              ? AlertCircle
              : Info;
        return (
          <Primitive.Root
            key={message.id}
            defaultOpen
            type={message.tone === "danger" ? "foreground" : "background"}
            className={variants({ tone: message.tone })}
            onOpenChange={(open) => {
              if (!open) onDismiss(message.id);
            }}
          >
            <Icon
              className={`mt-1 size-5 shrink-0 ${message.tone === "danger" ? "text-danger" : message.tone === "success" ? "text-success" : "text-brand"}`}
              aria-hidden="true"
            />
            <div className="flex-1">
              <Primitive.Title className="text-sm font-semibold">{message.title}</Primitive.Title>
              {message.description ? (
                <Primitive.Description className="mt-1 text-xs text-muted-foreground">
                  {message.description}
                </Primitive.Description>
              ) : null}
            </div>
            <Primitive.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="-mt-2 -mr-2"
                aria-label="Dismiss notification"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </Primitive.Close>
          </Primitive.Root>
        );
      })}
      <Primitive.Viewport
        aria-label="Notifications"
        className="fixed right-4 bottom-[max(5.5rem,env(safe-area-inset-bottom))] z-100 flex max-h-screen w-[calc(100%-2rem)] max-w-sm list-none flex-col gap-3 outline-none"
      />
    </Primitive.Provider>
  );
}
