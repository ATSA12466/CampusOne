import type { ComponentProps } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
export function EmailField({ error, ...props }: ComponentProps<"input"> & { error?: string }) {
  return (
    <Field id="auth-email" label="Email" required error={error}>
      <Input
        id="auth-email"
        type="email"
        autoComplete="email"
        inputMode="email"
        maxLength={254}
        placeholder="ama@campusone.demo"
        aria-invalid={!!error}
        aria-describedby={error ? "auth-email-error" : undefined}
        {...props}
      />
    </Field>
  );
}
