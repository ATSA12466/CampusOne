"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Button,
  Card,
  Input,
  Select,
  Textarea,
  Field,
  Badge,
} from "@/components/ui";
import { campusActionService } from "@/services";
import { useCampusActivity } from "@/features/campus-feed/hooks/use-campus-activity";
import {
  srcRequestSchema,
  type SrcRequestValues,
} from "../validation/src-request.schema";
const defaults: SrcRequestValues = {
  title: "",
  category: "Academic support",
  description: "",
};
export function SrcRequestForm() {
  const activity = useCampusActivity(),
    form = useForm<SrcRequestValues>({
      resolver: zodResolver(srcRequestSchema),
      defaultValues: defaults,
    });
  return (
    <Card>
      <h2 className="font-display text-xl font-semibold">
        Submit student request{" "}
        {campusActionService.source === "demo" ? "(demo)" : ""}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {campusActionService.source === "demo"
          ? "Requests stay with your local profile. No SRC office receives this demo draft."
          : "Requests go to the configured service; official processing depends on the university backend."}
      </p>
      {!activity.ready ? (
        <p className="mt-3 text-sm text-warning">
          Sign in before saving private requests.
        </p>
      ) : null}
      <form
        noValidate
        className="mt-5 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          if (
            await activity.run((signal) =>
              campusActionService.submitRequest(values, { signal }),
            )
          )
            form.reset(defaults);
        })}
      >
        <fieldset
          disabled={
            !activity.ready ||
            activity.loading ||
            !!activity.error ||
            activity.busy
          }
          className="space-y-4"
        >
          <Field
            id="src-title"
            label="Request title"
            error={form.formState.errors.title?.message}
          >
            <Input
              id="src-title"
              aria-label="Request title"
              aria-invalid={!!form.formState.errors.title}
              maxLength={120}
              {...form.register("title")}
            />
          </Field>
          <Field id="src-category" label="Request category">
            <Select id="src-category" {...form.register("category")}>
              <option>Academic support</option>
              <option>Welfare</option>
              <option>Infrastructure</option>
            </Select>
          </Field>
          <Field
            id="src-description"
            label="Request description"
            error={form.formState.errors.description?.message}
          >
            <Textarea
              id="src-description"
              aria-label="Request description"
              aria-invalid={!!form.formState.errors.description}
              maxLength={2000}
              rows={5}
              {...form.register("description")}
            />
          </Field>
          <Button type="submit">
            {activity.busy ? "Saving request…" : "Submit request"}
          </Button>
        </fieldset>
      </form>
      {activity.notice ? (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          {activity.notice}
        </p>
      ) : null}
      {activity.error ? (
        <div role="alert" className="mt-4">
          <p>{activity.error}</p>
          <Button onClick={activity.refresh}>Retry private activity</Button>
        </div>
      ) : null}
      <div className="mt-6 border-t border-border pt-5">
        <h3 className="font-semibold">Recent request statuses</h3>
        {activity.loading ? (
          <p role="status">Loading your requests…</p>
        ) : activity.requests.length ? (
          <ul className="mt-4 space-y-3">
            {activity.requests.slice(0, 6).map((r) => (
              <li
                key={r.id}
                className="rounded-control border border-border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{r.title}</p>
                  <Badge tone={r.status === "resolved" ? "success" : "warning"}>
                    {r.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {r.category} · {r.createdAt}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No loaded requests to show.
          </p>
        )}
      </div>
    </Card>
  );
}
