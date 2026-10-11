"use client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ValidatedForm } from "@/components/shared/validated-form";
import { enquiryInputSchema } from "@/services/validation/workspace.schema";
import { useWorkspace } from "@/features/workspace/hooks/use-workspace";
import type { ListingDomain } from "@/types/listings";
export function EnquiryDialog({
  domain,
  id,
  title,
  intent = "enquiry",
}: {
  domain: ListingDomain;
  id: string;
  title: string;
  intent?: "enquiry" | "report" | "application";
}) {
  const workspace = useWorkspace("enquiries");
  return (
    <Dialog
      title={
        intent === "report"
          ? "Flag this listing"
          : intent === "application"
            ? "Prepare your application"
            : "Ask a question"
      }
      description="In demo mode this is a private device-only draft, not a message delivered to a host, seller, provider or university."
      trigger={
        <Button
          variant={intent === "report" ? "ghost" : "primary"}
          disabled={!workspace.ready}
        >
          {title}
        </Button>
      }
    >
      <ValidatedForm
        key={workspace.owner}
        schema={enquiryInputSchema}
        fields={[
          {
            name: "message",
            label:
              intent === "report"
                ? "Reason for reporting"
                : "Your message or application notes",
            type: "textarea",
            maxLength: 1500,
          },
          {
            name: "consent",
            label: "I understand where this is saved",
            type: "select",
            options: ["yes"],
          },
        ]}
        submitLabel="Save local draft / submit to service"
        disabled={workspace.busy || !workspace.ready}
        onSubmit={async (data) => {
          await workspace.put({
            id: crypto.randomUUID(),
            category: domain,
            listingId: id,
            message: data.message,
            intent,
            createdAt: new Date().toISOString(),
          });
        }}
      />
      {workspace.notice ? (
        <p role="status" className="mt-4 text-sm">
          {workspace.notice}
        </p>
      ) : null}
      {workspace.error ? <p role="alert">{workspace.error}</p> : null}
    </Dialog>
  );
}
