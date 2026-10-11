"use client";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { eventCalendar } from "@/lib/events/calendar";
import { eventActionService } from "@/services";
import type { EventItem } from "@/types";
export function CalendarButton({ event }: { event: EventItem }) {
  const toast = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        try {
          const file = eventCalendar(event, eventActionService.source, new Date().toISOString()),
            url = URL.createObjectURL(
              new Blob([file.content], { type: "text/calendar;charset=utf-8" }),
            ),
            anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = file.filename;
          document.body.append(anchor);
          anchor.click();
          anchor.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 1500);
          toast({
            title: "Calendar file prepared",
            description:
              "Open the downloaded .ics file in your calendar. Check the listing for future schedule changes.",
            tone: "success",
          });
        } catch (error) {
          toast({
            title: "Calendar export needs another try",
            description:
              error instanceof Error ? error.message : "The calendar file could not be prepared.",
            tone: "danger",
          });
        }
      }}
    >
      <CalendarPlus className="size-4" aria-hidden="true" />
      Add to calendar
    </Button>
  );
}
