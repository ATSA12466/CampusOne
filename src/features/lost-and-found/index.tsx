"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Card, Input, Select } from "@/components/ui";
import { lifeService } from "@/services";

export function LostAndFoundFeature() {
  const [items, setItems] = useState(lifeService.listLostFound());
  const [item, setItem] = useState("");
  const [reportType, setReportType] = useState<"lost" | "found">("lost");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Lost & Found"
        description="Report and discover lost or found items in the community."
      />
      <Card>
        <h2 className="font-semibold">Submit report</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <Input
            aria-label="Item name"
            value={item}
            onChange={(event) => setItem(event.target.value)}
            placeholder="Item name"
          />
          <Select
            aria-label="Report type"
            value={reportType}
            onChange={(event) => setReportType(event.target.value as "lost" | "found")}
          >
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </Select>
          <Button
            onClick={() => {
              if (!item.trim()) return;
              setItems((current) => [
                {
                  id: crypto.randomUUID(),
                  type: reportType,
                  item,
                  location: "Not specified",
                  date: new Date().toISOString().slice(0, 10),
                  status: "open",
                },
                ...current,
              ]);
              setItem("");
            }}
          >
            Submit
          </Button>
        </div>
      </Card>
      <div className="space-y-3">
        {items.map((report) => (
          <Card key={report.id}>
            <p className="font-medium">{report.item}</p>
            <p className="text-sm text-muted-foreground">
              {report.type.toUpperCase()} • {report.location} • {report.date}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
