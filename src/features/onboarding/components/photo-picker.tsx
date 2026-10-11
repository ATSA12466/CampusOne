"use client";
import * as Radio from "@radix-ui/react-radio-group";
import { useEffect, useRef, useState } from "react";
import { Camera, LoaderCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { images } from "@/config/images";
import { useAuthStore } from "@/stores/auth-store";
import type { ProfileSetup } from "@/types/auth";
type Editor = typeof import("./photo-editor").PhotoEditor;
export function PhotoPicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: ProfileSetup["portrait"];
  onChange: (value: ProfileSetup["portrait"]) => void;
}) {
  const photo = useAuthStore((state) => state.photo);
  const [EditorComponent, setEditor] = useState<Editor | null>(null);
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState(false),
    [failed, setFailed] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null),
    wanted = useRef(false);
  useEffect(
    () => () => {
      wanted.current = false;
    },
    [],
  );
  useEffect(() => {
    if (!pending) return;
    const cancel = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        wanted.current = false;
        setPending(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", cancel);
    return () => document.removeEventListener("keydown", cancel);
  }, [pending]);
  const options = [
    { value: "initials", label: "Your initials", image: undefined },
    { value: "ama", label: "Demo portrait A", image: images.studentAma },
    { value: "kojo", label: "Demo portrait B", image: images.studentKojo },
    ...(photo ? [{ value: "upload", label: "Your local photo", image: photo }] : []),
  ];
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-sm font-semibold">
        Profile photo <span className="font-normal text-muted-foreground">(optional)</span>
      </legend>
      <Radio.Root
        aria-label="Profile portrait"
        className="grid grid-cols-3 gap-2"
        value={photo ? "upload" : value}
        onValueChange={(next) => {
          if (next === "initials" || next === "ama" || next === "kojo") {
            useAuthStore.getState().clearPhoto();
            onChange(next);
          }
        }}
      >
        {options.map((option) => (
          <Radio.Item
            key={option.value}
            value={option.value}
            aria-label={option.label}
            className="flex min-h-28 min-w-0 flex-col items-center justify-center gap-2 rounded-card border border-border bg-surface p-2 data-[state=checked]:border-brand data-[state=checked]:bg-brand-soft"
          >
            <Avatar name={name || "Your profile"} image={option.image} size="lg" />
            <span className="text-center text-[10px] font-semibold">{option.label}</span>
          </Radio.Item>
        ))}
      </Radio.Root>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Demo portraits depict fictional people. Your own cropped photo lasts only until reload or
        sign-out.
      </p>
      <Button
        ref={trigger}
        variant="secondary"
        className="mt-3"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-busy={pending || undefined}
        onClick={() => {
          wanted.current = true;
          if (EditorComponent) {
            setOpen(true);
            return;
          }
          setPending(true);
          setFailed(false);
          void import("./photo-editor")
            .then((module) => {
              setEditor(() => module.PhotoEditor);
              setPending(false);
              if (wanted.current) setOpen(true);
            })
            .catch(() => {
              setPending(false);
              if (wanted.current) setFailed(true);
            });
        }}
      >
        {pending ? (
          <LoaderCircle
            className="size-4 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        ) : (
          <Camera className="size-4" aria-hidden="true" />
        )}
        {pending ? "Opening photo editor…" : "Add your own photo"}
      </Button>
      {photo ? (
        <Button
          variant="ghost"
          className="mt-3"
          onClick={() => useAuthStore.getState().clearPhoto()}
        >
          Remove local photo
        </Button>
      ) : null}
      {failed ? (
        <p role="alert" className="mt-2 rounded-control bg-danger-soft p-3 text-sm text-danger">
          The photo editor couldn&apos;t load. Save changes, then{" "}
          <button
            type="button"
            className="min-h-11 rounded-control px-2 underline"
            onClick={() => window.location.reload()}
          >
            reload the page
          </button>
          .
        </p>
      ) : null}
      {EditorComponent ? (
        <EditorComponent open={open} onOpenChange={setOpen} returnFocusRef={trigger} />
      ) : null}
    </fieldset>
  );
}
