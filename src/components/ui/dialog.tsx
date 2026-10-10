"use client";

import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cva } from "class-variance-authority";
import type { ReactNode, RefObject, KeyboardEventHandler } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils/cn";

const contentVariants = cva(
  "fixed z-60 overflow-y-auto border border-border bg-surface-raised p-6 text-foreground shadow-overlay outline-none",
  {
    variants: {
      kind: {
        dialog:
          "dialog-enter top-1/2 left-1/2 max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-media",
        sheet:
          "sheet-enter inset-x-0 bottom-0 mx-auto max-h-[90dvh] w-full max-w-xl rounded-t-media pb-[max(1.5rem,env(safe-area-inset-bottom))]",
        lightbox:
          "dialog-enter top-1/2 left-1/2 max-h-[95dvh] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-media",
      },
    },
    defaultVariants: { kind: "dialog" },
  },
);
interface Props {
  title: string;
  description?: string;
  trigger?: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  kind?: "dialog" | "sheet" | "lightbox";
  className?: string;
  returnFocusRef?: RefObject<HTMLElement | null>;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
}
export function Dialog({
  title,
  description,
  trigger,
  children,
  open,
  onOpenChange,
  kind,
  className,
  returnFocusRef,
  onKeyDown,
}: Props) {
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Primitive.Trigger asChild>{trigger}</Primitive.Trigger> : null}
      <Primitive.Portal>
        <Primitive.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm" />
        <Primitive.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(contentVariants({ kind }), className)}
          onKeyDown={onKeyDown}
          onCloseAutoFocus={(event) => {
            if (returnFocusRef?.current) {
              event.preventDefault();
              returnFocusRef.current.focus();
            }
          }}
        >
          <div className="mb-5 pr-12">
            <Primitive.Title className="font-display text-2xl font-semibold tracking-tight">
              {title}
            </Primitive.Title>
            {description ? (
              <Primitive.Description className="mt-2 text-sm text-muted-foreground">
                {description}
              </Primitive.Description>
            ) : null}
          </div>
          {children}
          <Primitive.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3"
              aria-label="Close dialog"
            >
              <X className="size-5" aria-hidden="true" />
            </Button>
          </Primitive.Close>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
export function Sheet(props: Omit<Props, "kind">) {
  return <Dialog {...props} kind="sheet" />;
}
export const DialogClose = Primitive.Close;
