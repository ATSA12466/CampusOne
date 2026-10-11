"use client";
import { Button } from "@/components/ui/button";
export function ResourceDownload({
  title,
  body,
  id,
}: {
  title: string;
  body: string[];
  id: string;
}) {
  return (
    <section className="rounded-media border border-border bg-surface p-5">
      <h2 className="font-display text-xl font-semibold">
        Take a small study prompt with you.
      </h2>
      <p className="my-3 text-xs text-muted-foreground">
        Downloads illustrative plain-text notes, not the original
        PDF/video/slides or official course materials.
      </p>
      <Button
        variant="secondary"
        onClick={() => {
          const text = `CampusOne fictional study prompt: ${title}\n\n${body.join("\n\n")}\n\nNot an official GCTU handout.`;
          const blob = new Blob([text], { type: "text/plain;charset=utf-8" }),
            url = URL.createObjectURL(blob),
            anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = `${id}-demo-study-notes.txt`;
          anchor.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}
      >
        Download demo notes (.txt)
      </Button>
    </section>
  );
}
