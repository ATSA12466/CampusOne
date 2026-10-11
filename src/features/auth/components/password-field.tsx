"use client";
import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
export function PasswordField({
  id = "auth-password",
  label = "Password",
  error,
  hint,
  ...props
}: ComponentProps<"input"> & { label?: string; error?: string; hint?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field id={id} label={label} required hint={hint} error={error}>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          maxLength={128}
          className="pr-14"
          aria-invalid={!!error}
          aria-describedby={
            [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") ||
            undefined
          }
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-1 grid min-h-11 w-11 place-items-center rounded-control text-muted-foreground"
          onClick={() => setVisible((value) => !value)}
          aria-pressed={visible}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        >
          {visible ? (
            <EyeOff className="size-5" aria-hidden="true" />
          ) : (
            <Eye className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </Field>
  );
}
