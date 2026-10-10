"use client";
import { BookOpen, MoreHorizontal, Bookmark, Info, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Dialog, DialogClose, Sheet } from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
export function OverlayPreview() {
  const toast = useToast();
  return (
    <Card padding="lg" className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Dialog
          title="Save your next chapter"
          description="This is a design-system dialog, not a submission to an official campus service."
          trigger={<Button variant="secondary">Open dialog</Button>}
        >
          <p className="mb-5 text-sm text-muted-foreground">
            Everything you need for a calm, predictable interaction: named content, focused controls
            and a clear way back.
          </p>
          <DialogClose asChild>
            <Button>Got it</Button>
          </DialogClose>
        </Dialog>
        <Sheet
          title="A little more campus"
          description="A bottom sheet shares the same accessible interaction contract."
          trigger={<Button variant="secondary">Open sheet</Button>}
        >
          <div className="space-y-3">
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => toast({ title: "Resource saved", tone: "success" })}
            >
              <BookOpen className="size-4" aria-hidden="true" />
              Save a learning resource
            </Button>
            <p className="text-xs text-muted-foreground">
              Try Tab, Shift+Tab and Escape. Focus stays here until you close.
            </p>
          </div>
        </Sheet>
        <Dropdown
          label="Preview actions"
          trigger={
            <Button variant="ghost" size="icon" aria-label="Open preview action menu">
              <MoreHorizontal className="size-5" aria-hidden="true" />
            </Button>
          }
          items={[
            {
              label: "Save preview",
              icon: <Bookmark className="size-4" aria-hidden="true" />,
              onSelect: () => toast({ title: "Preview saved", tone: "success" }),
            },
            { label: "Unavailable action", disabled: true, onSelect: () => undefined },
            {
              label: "Sign out (preview)",
              danger: true,
              icon: <LogOut className="size-4" aria-hidden="true" />,
              onSelect: () =>
                toast({
                  title: "This is only a preview",
                  description: "Your session has not changed.",
                  tone: "info",
                }),
            },
          ]}
        />
        <Tooltip content="Helpful context, never essential instructions.">
          <Button variant="ghost" size="icon" aria-label="About tooltips">
            <Info className="size-5" aria-hidden="true" />
          </Button>
        </Tooltip>
      </div>
      <p className="text-sm text-muted-foreground">
        No homemade focus traps. No invisible close actions. All overlay primitives use Radix and
        inherit the active theme.
      </p>
      <Tabs
        label="Pill tabs preview"
        variant="pill"
        tabs={[
          {
            value: "for-you",
            label: "For you",
            content: (
              <p className="text-sm text-muted-foreground">
                Recommendations from your programme and communities.
              </p>
            ),
          },
          {
            value: "following",
            label: "Following",
            content: (
              <p className="text-sm text-muted-foreground">Updates from the clubs you choose.</p>
            ),
          },
        ]}
      />
    </Card>
  );
}
