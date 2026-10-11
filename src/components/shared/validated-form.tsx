"use client";
import { useId, useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
export interface FormField {
  name: string;
  label: string;
  type?: "text" | "email" | "date" | "number" | "time" | "textarea" | "select";
  options?: readonly string[];
  placeholder?: string;
  maxLength?: number;
}
export function ValidatedForm<T>({
  schema,
  fields,
  initial = {},
  submitLabel,
  onSubmit,
  disabled = false,
}: {
  schema: z.ZodType<T>;
  fields: FormField[];
  initial?: Record<string, string>;
  submitLabel: string;
  onSubmit: (value: T) => Promise<void> | void;
  disabled?: boolean;
}) {
  const id = useId(),
    [values, setValues] = useState<Record<string, string>>(() =>
      Object.fromEntries(
        fields.map((field) => [field.name, initial[field.name] ?? ""]),
      ),
    ),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <form
      noValidate
      className="space-y-4"
      aria-busy={busy}
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy || disabled) return;
        const parsed = schema.safeParse(values);
        if (!parsed.success) {
          const next: Record<string, string> = {};
          for (const issue of parsed.error.issues)
            next[String(issue.path[0])] = issue.message;
          setErrors(next);
          document.getElementById(`${id}-${Object.keys(next)[0]}`)?.focus();
          return;
        }
        setErrors({});
        setMessage("");
        setBusy(true);
        try {
          await onSubmit(parsed.data);
          setMessage("Changes saved.");
        } catch (cause) {
          setMessage(
            cause instanceof Error
              ? cause.message
              : "Changes could not save. Please retry.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {fields.map((field) => {
        const key = `${id}-${field.name}`,
          common = {
            id: key,
            name: field.name,
            value: values[field.name] ?? "",
            disabled: busy || disabled,
            "aria-invalid": !!errors[field.name],
            "aria-describedby": errors[field.name] ? `${key}-error` : undefined,
            onChange: (
              e: React.ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
              >,
            ) => setValues((v) => ({ ...v, [field.name]: e.target.value })),
          };
        return (
          <div key={field.name}>
            <label htmlFor={key} className="mb-1.5 block text-sm font-medium">
              {field.label}
            </label>
            {field.type === "select" ? (
              <Select {...common}>
                <option value="">Choose an option</option>
                {field.options?.map((o) => <option key={o}>{o}</option>)}
              </Select>
            ) : field.type === "textarea" ? (
              <Textarea
                {...common}
                rows={4}
                maxLength={field.maxLength ?? 2000}
                placeholder={field.placeholder}
              />
            ) : (
              <Input
                {...common}
                type={field.type ?? "text"}
                maxLength={field.maxLength ?? 120}
                placeholder={field.placeholder}
              />
            )}
            {errors[field.name] ? (
              <p id={`${key}-error`} className="mt-1 text-xs text-danger">
                {errors[field.name]}
              </p>
            ) : null}
          </div>
        );
      })}
      <Button type="submit" disabled={busy || disabled}>
        {busy ? "Saving…" : submitLabel}
      </Button>
      {message ? (
        <p
          role="status"
          className="rounded-control bg-surface-muted p-3 text-sm"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
