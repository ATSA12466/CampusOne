"use client";

import { useState } from "react";
import { ArrowUpRight, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup } from "@/components/ui/radio";
import { Rating } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { ShowcaseSection } from "./showcase-section";
import { FormFieldsPreview } from "./form-fields-preview";

export function ControlsShowcase() {
  const [checked, setChecked] = useState(true);
  const [indeterminate, setIndeterminate] = useState<boolean | "indeterminate">("indeterminate");
  const [liked, setLiked] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [privacy, setPrivacy] = useState("friends");
  const [rating, setRating] = useState(4);
  const toast = useToast();
  return (
    <ShowcaseSection
      id="controls"
      number="04"
      title="Comfortable by default."
      description="44 px minimum targets, visible focus, properly named fields and predictable states. Familiar native inputs meet lightweight headless interactions."
    >
      <Card padding="lg">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() =>
              toast({
                title: "You're all set",
                description: "A working toast from the shared UI kit.",
                tone: "success",
              })
            }
          >
            Primary action <ArrowUpRight className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Quiet action</Button>
          <Button variant="gold">A little sunshine</Button>
          <Button
            variant="danger"
            onClick={() =>
              toast({
                title: "Couldn't save just yet",
                description: "Friendly feedback. Your draft is still here.",
                tone: "danger",
              })
            }
          >
            Destructive
          </Button>
          <Button disabled>Disabled</Button>
          <Button disabled aria-busy="true">
            <Loader2
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            Loading
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Like this component preview"
            aria-pressed={liked}
            onClick={() => setLiked(!liked)}
          >
            <Heart
              className={`size-5 ${liked ? "fill-current text-danger" : ""}`}
              aria-hidden="true"
            />
          </Button>
        </div>
        <div className="mt-7 flex flex-wrap gap-2">
          {(["neutral", "primary", "success", "warning", "danger", "gold"] as const).map((tone) => (
            <Badge tone={tone} key={tone}>
              {tone}
            </Badge>
          ))}
        </div>
      </Card>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <FormFieldsPreview />
        <Card padding="lg" className="space-y-5">
          <Checkbox
            label="Keep this resource saved"
            description="A generous hit area, without an oversized visual checkbox."
            checked={checked}
            onCheckedChange={(value) => setChecked(value === true)}
          />
          <Checkbox
            label="Indeterminate selection"
            checked={indeterminate}
            onCheckedChange={setIndeterminate}
          />
          <Switch
            label="Campus notifications"
            description="Important updates, at your pace."
            checked={notifications}
            onCheckedChange={setNotifications}
          />
          <RadioGroup
            label="Profile visibility"
            value={privacy}
            onValueChange={setPrivacy}
            options={[
              {
                value: "friends",
                label: "Campus friends",
                description: "Visible to people you connect with.",
              },
              { value: "private", label: "Only me", description: "A little more private." },
            ]}
          />
          <div className="border-t border-border pt-5">
            <p className="mb-2 text-sm font-semibold">Rate this experience</p>
            <Rating value={rating} onValueChange={setRating} label="Component experience rating" />
            <p className="mt-2 text-xs text-muted-foreground">
              Read-only: <Rating value={4.8} label="Student reviews" />
            </p>
          </div>
        </Card>
      </div>
    </ShowcaseSection>
  );
}
