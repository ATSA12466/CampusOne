"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { useAppStore } from "@/stores/app-store";
import { srcRequestSchema, type SrcRequestValues } from "../validation/src-request.schema";

const DEFAULT_VALUES: SrcRequestValues = {
  title: "",
  category: "Academic support",
  description: "",
};

export function SrcRequestForm() {
  const submitRequest = useAppStore((state) => state.submitSrcRequest);
  const requests = useAppStore((state) => state.srcRequests);

  const form = useForm<SrcRequestValues>({
    resolver: zodResolver(srcRequestSchema),
    defaultValues: DEFAULT_VALUES,
  });

  return (
    <Card>
      <h2 className="font-semibold">Submit student request (demo)</h2>
      <form
        className="mt-3 space-y-2"
        onSubmit={form.handleSubmit((values) => {
          submitRequest(values);
          form.reset(DEFAULT_VALUES);
        })}
      >
        <Input
          aria-label="Request title"
          aria-invalid={!!form.formState.errors.title}
          placeholder="Request title"
          {...form.register("title")}
        />
        {form.formState.errors.title ? (
          <p className="text-xs text-danger">{form.formState.errors.title.message}</p>
        ) : null}
        <Select aria-label="Request category" {...form.register("category")}>
          <option value="Academic support">Academic support</option>
          <option value="Welfare">Welfare</option>
          <option value="Infrastructure">Infrastructure</option>
        </Select>
        <Textarea
          aria-label="Request description"
          aria-invalid={!!form.formState.errors.description}
          rows={3}
          placeholder="Describe your request..."
          {...form.register("description")}
        />
        {form.formState.errors.description ? (
          <p className="text-xs text-danger">{form.formState.errors.description.message}</p>
        ) : null}
        <Button type="submit">Submit request</Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        Demo submission only until backend SRC workflow is integrated.
      </p>

      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold">Recent request statuses</h3>
        {requests.slice(0, 3).map((request) => (
          <div
            key={request.id}
            className="rounded-lg border border-[var(--color-border)] p-2 text-xs"
          >
            <p className="font-medium text-foreground">{request.title}</p>
            <p className="text-muted-foreground">
              {request.category} • {request.status} • {request.createdAt}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
