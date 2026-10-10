"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge, Button, Card } from "@/components/ui";
import { engagementService } from "@/services/demo";
import { useAppStore } from "@/stores/app-store";

export function EventsFeature() {
  const events = engagementService.listEvents();
  const registrations = useAppStore((state) => state.registrations);
  const toggleRegistration = useAppStore((state) => state.toggleEventRegistration);

  return (
    <div className="space-y-4">
      <PageHeader title="Events & Tickets" description="Discover events, register, and preview demo digital tickets." />
      <div className="grid gap-3 lg:grid-cols-2">
        {events.map((event) => {
          const registered = registrations.includes(event.id);
          return (
            <Card key={event.id}>
              <p className="text-xs uppercase text-slate-500">{event.category}</p>
              <h2 className="mt-1 font-semibold">{event.title}</h2>
              <p className="text-sm text-slate-600">{event.date} • {event.venue}</p>
              <p className="mt-1 text-xs text-slate-500">{event.registered}/{event.seats} registered</p>
              <div className="mt-3 flex gap-2">
                <Link href={`/events/${event.id}`}><Button size="sm" variant="secondary">Details</Button></Link>
                <Button size="sm" onClick={() => toggleRegistration(event.id)}>{registered ? "Cancel" : "Register"}</Button>
              </div>
              {registered ? <Badge tone="success" className="mt-2">Ticket active (demo)</Badge> : null}
            </Card>
          );
        })}
      </div>
      {registrations[0] ? (
        <Card>
          <h3 className="font-semibold">Demo QR ticket preview</h3>
          <p className="text-xs text-slate-500">For UI demonstration only — not an official entry credential.</p>
          <div className="mt-3 inline-block rounded-xl border border-[var(--color-border)] bg-white p-3">
            <QRCodeSVG value={`campusone-demo-ticket:${registrations[0]}`} size={120} />
          </div>
        </Card>
      ) : null}
    </div>
  );
}
